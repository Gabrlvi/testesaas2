// Product management
let editingProductId = null;
let produtos = [];

function loadProducts() {
    produtos = getUserData('produtos') || [];
    renderProductsTable();
}

function toggleProductForm(show = true) {
    const form = document.getElementById('productForm');
    const addBtn = document.getElementById('addProductBtn');
    
    form.style.display = show ? 'block' : 'none';
    addBtn.style.display = show ? 'none' : 'block';
    
    if (!show) {
        editingProductId = null;
        document.getElementById('newProductForm').reset();
    }
}

function generateProductId() {
    return 'prod_' + Math.random().toString(36).substr(2, 9);
}

function saveProduct(event) {
    event.preventDefault();
    
    const nome = document.getElementById('nome').value;
    const precoCompra = parseFloat(document.getElementById('precoCompra').value);
    const precoVenda = parseFloat(document.getElementById('precoVenda').value);
    const descricao = document.getElementById('descricao').value;
    
    if (precoVenda < precoCompra) {
        showMessage('O preço de venda não pode ser menor que o preço de compra', 'danger');
        return;
    }
    
    const produto = {
        id: editingProductId || generateProductId(),
        nome,
        precoCompra,
        precoVenda,
        descricao
    };
    
    if (editingProductId) {
        const index = produtos.findIndex(p => p.id === editingProductId);
        if (index !== -1) {
            produtos[index] = produto;
        }
    } else {
        produtos.push(produto);
    }
    
    setUserData('produtos', produtos);
    toggleProductForm(false);
    renderProductsTable();
    showMessage(`Produto ${editingProductId ? 'atualizado' : 'cadastrado'} com sucesso!`);
}

function editProduct(id) {
    const produto = produtos.find(p => p.id === id);
    if (!produto) return;
    
    editingProductId = id;
    document.getElementById('nome').value = produto.nome;
    document.getElementById('precoCompra').value = produto.precoCompra;
    document.getElementById('precoVenda').value = produto.precoVenda;
    document.getElementById('descricao').value = produto.descricao;
    
    toggleProductForm(true);
}

function deleteProduct(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    const index = produtos.findIndex(p => p.id === id);
    if (index !== -1) {
        produtos.splice(index, 1);
        setUserData('produtos', produtos);
        renderProductsTable();
        showMessage('Produto excluído com sucesso!');
    }
}

function addToSale(id) {
    const produto = produtos.find(p => p.id === id);
    if (!produto) return;
    
    // Store the product in sessionStorage for the sales page
    sessionStorage.setItem('selectedProduct', JSON.stringify(produto));
    window.location.href = 'vendas.html';
}

function renderProductsTable() {
    const tbody = document.querySelector('#productsTable tbody');
    const searchTerm = document.getElementById('searchProduct').value.toLowerCase();
    
    const filteredProducts = produtos.filter(produto =>
        produto.nome.toLowerCase().includes(searchTerm) ||
        produto.descricao.toLowerCase().includes(searchTerm)
    );
    
    tbody.innerHTML = '';
    
    filteredProducts.forEach(produto => {
        const lucro = produto.precoVenda - produto.precoCompra;
        const lucroPercentual = (lucro / produto.precoCompra * 100).toFixed(1);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${produto.nome}</td>
            <td>${formatCurrency(produto.precoCompra)}</td>
            <td>${formatCurrency(produto.precoVenda)}</td>
            <td>${formatCurrency(lucro)} (${lucroPercentual}%)</td>
            <td>${produto.descricao || '-'}</td>
            <td class="table-actions-cell">
                <button onclick="editProduct('${produto.id}')" class="action-btn" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="addToSale('${produto.id}')" class="action-btn" title="Adicionar à Venda">
                    <i class="fas fa-cart-plus"></i>
                </button>
                <button onclick="deleteProduct('${produto.id}')" class="action-btn delete" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    if (filteredProducts.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="6" class="text-center">Nenhum produto encontrado</td>';
        tbody.appendChild(tr);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    
    const addProductBtn = document.getElementById('addProductBtn');
    addProductBtn.addEventListener('click', () => toggleProductForm(true));
    
    const productForm = document.getElementById('newProductForm');
    productForm.addEventListener('submit', saveProduct);
    
    const searchInput = document.getElementById('searchProduct');
    searchInput.addEventListener('input', renderProductsTable);
}); 