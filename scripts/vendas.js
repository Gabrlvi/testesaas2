// Sales management
let vendas = [];
let produtos = [];
let selectedProduct = null;

function loadSales() {
    vendas = getUserData('vendas') || [];
    produtos = getUserData('produtos') || [];
    renderSalesTable();
    populateProductSelect();
    
    // Check if there's a product selected from the products page
    const savedProduct = sessionStorage.getItem('selectedProduct');
    if (savedProduct) {
        selectedProduct = JSON.parse(savedProduct);
        sessionStorage.removeItem('selectedProduct');
        
        document.getElementById('produto').value = selectedProduct.id;
        document.getElementById('precoVenda').value = selectedProduct.precoVenda;
        toggleSaleForm(true);
        updateSaleSummary();
    }
}

function toggleSaleForm(show = true) {
    const form = document.getElementById('saleForm');
    const addBtn = document.getElementById('newSaleBtn');
    
    form.style.display = show ? 'block' : 'none';
    addBtn.style.display = show ? 'none' : 'block';
    
    if (show) {
        // Carregar produtos e popular o select
        produtos = getUserData('produtos') || [];
        populateProductSelect();
        
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('data').value = now.toISOString().slice(0, 16);
    } else {
        document.getElementById('newSaleForm').reset();
        selectedProduct = null;
    }
}

function populateProductSelect() {
    const select = document.getElementById('produto');
    select.innerHTML = '<option value="">Selecione um produto</option>';
    
    produtos.forEach(produto => {
        const option = document.createElement('option');
        option.value = produto.id;
        option.textContent = `${produto.nome} (${formatCurrency(produto.precoVenda)})`;
        select.appendChild(option);
    });
}

function updateSaleSummary() {
    const produtoId = document.getElementById('produto').value;
    const quantidade = parseInt(document.getElementById('quantidade').value) || 0;
    const precoVenda = parseFloat(document.getElementById('precoVenda').value) || 0;
    
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return;
    
    const totalVenda = quantidade * precoVenda;
    const custoTotal = quantidade * produto.precoCompra;
    const lucroPrevisto = totalVenda - custoTotal;
    
    document.getElementById('totalVenda').textContent = formatCurrency(totalVenda);
    document.getElementById('lucroPrevisto').textContent = formatCurrency(lucroPrevisto);
}

function saveSale(event) {
    event.preventDefault();
    
    const produtoId = document.getElementById('produto').value;
    const quantidade = parseInt(document.getElementById('quantidade').value);
    const precoVenda = parseFloat(document.getElementById('precoVenda').value);
    const data = document.getElementById('data').value;
    
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) {
        showMessage('Produto não encontrado', 'danger');
        return;
    }
    
    // Ajustar a data para meia-noite no fuso horário local
    const dataVenda = new Date(data);
    dataVenda.setHours(0, 0, 0, 0);
    
    const venda = {
        id: 'venda_' + Math.random().toString(36).substr(2, 9),
        produtoId,
        quantidade,
        precoVenda,
        data: dataVenda.toISOString(),
        custoUnitario: produto.precoCompra
    };
    
    // Adicionar o custo de compra como gasto
    const custoTotal = produto.precoCompra * quantidade;
    const gastoCompra = {
        id: 'gasto_' + Math.random().toString(36).substr(2, 9),
        categoria: 'Compra de Produtos',
        valor: custoTotal,
        data: dataVenda.toISOString(),
        descricao: `Compra de ${quantidade}x ${produto.nome}`
    };
    
    // Salvar a venda
    vendas.push(venda);
    setUserData('vendas', vendas);
    
    // Salvar o gasto
    const gastosExtras = getUserData('gastosExtras') || [];
    gastosExtras.push(gastoCompra);
    setUserData('gastosExtras', gastosExtras);
    
    toggleSaleForm(false);
    renderSalesTable();
    showMessage('Venda registrada com sucesso!');
}

function deleteSale(id) {
    if (!confirm('Tem certeza que deseja excluir esta venda?')) return;
    
    const index = vendas.findIndex(v => v.id === id);
    if (index !== -1) {
        const venda = vendas[index];
        
        // Remover a venda
        vendas.splice(index, 1);
        setUserData('vendas', vendas);
        
        // Remover o gasto correspondente
        const gastosExtras = getUserData('gastosExtras') || [];
        const gastoIndex = gastosExtras.findIndex(g => 
            g.data === venda.data && 
            g.categoria === 'Compra de Produtos' &&
            g.valor === (venda.custoUnitario * venda.quantidade)
        );
        
        if (gastoIndex !== -1) {
            gastosExtras.splice(gastoIndex, 1);
            setUserData('gastosExtras', gastosExtras);
        }
        
        // Remover apenas a linha da tabela correspondente à venda excluída
        const row = document.querySelector(`tr[data-venda-id="${id}"]`);
        if (row) {
            row.remove();
        }
        
        // Atualizar totais do período
        const filterDate = document.getElementById('filterDate').value;
        if (filterDate) {
            const [year, month, day] = filterDate.split('-');
            const filterDateObj = new Date(year, month - 1, day);
            filterDateObj.setHours(0, 0, 0, 0);
            
            const vendaDate = new Date(venda.data);
            vendaDate.setHours(0, 0, 0, 0);
            
            // Se a venda excluída era do período filtrado, atualizar os totais
            if (vendaDate.getTime() === filterDateObj.getTime()) {
                updateTotals();
            }
        } else {
            updateTotals();
        }
        
        // Atualizar o dashboard se estiver na página
        if (typeof loadDashboardData === 'function') {
            loadDashboardData();
        }
        
        showMessage('Venda excluída com sucesso!');
    }
}

function renderSalesTable() {
    const tbody = document.querySelector('#salesTable tbody');
    const searchTerm = document.getElementById('searchSale').value.toLowerCase();
    const filterDate = document.getElementById('filterDate').value;
    
    let filteredSales = vendas;
    
    // Apply date filter
    if (filterDate) {
        const [year, month, day] = filterDate.split('-');
        const filterDateObj = new Date(year, month - 1, day);
        filterDateObj.setHours(0, 0, 0, 0);
        
        filteredSales = filteredSales.filter(venda => {
            const vendaDate = new Date(venda.data);
            vendaDate.setHours(0, 0, 0, 0);
            return vendaDate.getTime() === filterDateObj.getTime();
        });
    }
    
    // Apply search filter
    if (searchTerm) {
        filteredSales = filteredSales.filter(venda => {
            const produto = produtos.find(p => p.id === venda.produtoId);
            return produto && produto.nome.toLowerCase().includes(searchTerm);
        });
    }
    
    // Sort by date (most recent first)
    filteredSales.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    tbody.innerHTML = '';
    
    let totalPeriodo = 0;
    let lucroPeriodo = 0;
    
    filteredSales.forEach(venda => {
        const produto = produtos.find(p => p.id === venda.produtoId);
        if (!produto) return;
        
        const total = venda.quantidade * venda.precoVenda;
        const custo = venda.quantidade * venda.custoUnitario;
        const lucro = total - custo;
        
        totalPeriodo += total;
        lucroPeriodo += lucro;
        
        const tr = document.createElement('tr');
        tr.setAttribute('data-venda-id', venda.id); // Adicionar ID da venda como atributo
        tr.innerHTML = `
            <td>${formatDate(venda.data)}</td>
            <td>${produto.nome}</td>
            <td>${venda.quantidade}</td>
            <td>${formatCurrency(venda.precoVenda)}</td>
            <td>${formatCurrency(total)}</td>
            <td>${formatCurrency(lucro)}</td>
            <td class="table-actions-cell">
                <button onclick="deleteSale('${venda.id}')" class="action-btn delete" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    if (filteredSales.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="7" class="text-center">Nenhuma venda encontrada</td>';
        tbody.appendChild(tr);
    }
    
    // Update totals
    document.getElementById('totalPeriodo').textContent = formatCurrency(totalPeriodo);
    document.getElementById('lucroPeriodo').textContent = formatCurrency(lucroPeriodo);
}

function updateTotals() {
    const filterDate = document.getElementById('filterDate').value;
    let totalPeriodo = 0;
    let lucroPeriodo = 0;
    
    let filteredSales = vendas;
    
    if (filterDate) {
        const [year, month, day] = filterDate.split('-');
        const filterDateObj = new Date(year, month - 1, day);
        filterDateObj.setHours(0, 0, 0, 0);
        
        filteredSales = filteredSales.filter(venda => {
            const vendaDate = new Date(venda.data);
            vendaDate.setHours(0, 0, 0, 0);
            return vendaDate.getTime() === filterDateObj.getTime();
        });
    }
    
    filteredSales.forEach(venda => {
        const total = venda.quantidade * venda.precoVenda;
        const custo = venda.quantidade * venda.custoUnitario;
        const lucro = total - custo;
        
        totalPeriodo += total;
        lucroPeriodo += lucro;
    });
    
    document.getElementById('totalPeriodo').textContent = formatCurrency(totalPeriodo);
    document.getElementById('lucroPeriodo').textContent = formatCurrency(lucroPeriodo);
}

function loadSalesData() {
    vendas = getUserData('vendas') || [];
    produtos = getUserData('produtos') || [];
    
    // Limpar o filtro de data
    document.getElementById('filterDate').value = '';
    
    renderSalesTable();
    updateTotals();
}

function updateSalePrice() {
    const produtoId = document.getElementById('produto').value;
    const produto = produtos.find(p => p.id === produtoId);
    
    if (produto) {
        document.getElementById('precoVenda').value = produto.precoVenda;
        updateSaleSummary();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadSalesData();
    
    // Event listeners para filtros
    document.getElementById('searchSale').addEventListener('input', renderSalesTable);
    document.getElementById('filterDate').addEventListener('change', () => {
        renderSalesTable();
        updateTotals();
    });
    
    // Event listener para o botão Nova Venda
    document.getElementById('newSaleBtn').addEventListener('click', () => toggleSaleForm(true));
    
    // Event listener para o formulário de nova venda
    document.getElementById('newSaleForm').addEventListener('submit', saveSale);
    
    // Event listener para seleção de produto
    document.getElementById('produto').addEventListener('change', updateSalePrice);
    document.getElementById('quantidade').addEventListener('input', updateSaleSummary);
    document.getElementById('precoVenda').addEventListener('input', updateSaleSummary);
}); 