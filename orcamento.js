// Variáveis globais
let produtos = [];
let itensOrcamento = [];
let editingItemId = null;

// Carregar dados iniciais
function loadBudgetData() {
    produtos = getUserData('produtos') || [];
    itensOrcamento = getUserData('orcamentos') || [];
    populateProductSelect();
    renderBudgetTable();
}

// Preencher select de produtos
function populateProductSelect() {
    const select = document.getElementById('produto');
    select.innerHTML = '<option value="">Selecione um produto</option>';
    
    produtos.forEach(produto => {
        const option = document.createElement('option');
        option.value = produto.id;
        option.textContent = produto.nome;
        select.appendChild(option);
    });
}

// Atualizar valor unitário ao selecionar produto
function updateUnitValue() {
    const produtoId = document.getElementById('produto').value;
    const valorUnitarioInput = document.getElementById('valorUnitario');
    
    if (produtoId) {
        const produto = produtos.find(p => p.id === produtoId);
        if (produto) {
            valorUnitarioInput.value = produto.precoVenda;
        }
    } else {
        valorUnitarioInput.value = '';
    }
}

// Renderizar tabela de itens
function renderBudgetTable() {
    const tbody = document.querySelector('#budgetTable tbody');
    tbody.innerHTML = '';
    
    if (itensOrcamento.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="5" class="text-center">Nenhum item adicionado</td>';
        tbody.appendChild(tr);
        updateTotal();
        return;
    }
    
    itensOrcamento.forEach(item => {
        const produto = produtos.find(p => p.id === item.produtoId);
        if (!produto) return;
        
        const total = item.quantidade * item.valorUnitario;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${produto.nome}</td>
            <td>${item.quantidade}</td>
            <td>${formatCurrency(item.valorUnitario)}</td>
            <td>${formatCurrency(total)}</td>
            <td class="table-actions-cell">
                <button onclick="editItem('${item.id}')" class="action-btn edit" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteItem('${item.id}')" class="action-btn delete" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    updateTotal();
}

// Atualizar valor total
function updateTotal() {
    const total = itensOrcamento.reduce((sum, item) => 
        sum + (item.quantidade * item.valorUnitario), 0);
    
    document.getElementById('totalValue').textContent = formatCurrency(total);
}

// Adicionar/Editar item
function saveItem(event) {
    event.preventDefault();
    
    const produtoId = document.getElementById('produto').value;
    const quantidade = parseInt(document.getElementById('quantidade').value);
    const valorUnitario = parseFloat(document.getElementById('valorUnitario').value);
    
    if (editingItemId) {
        // Editar item existente
        const index = itensOrcamento.findIndex(item => item.id === editingItemId);
        if (index !== -1) {
            itensOrcamento[index] = {
                ...itensOrcamento[index],
                produtoId,
                quantidade,
                valorUnitario
            };
        }
    } else {
        // Adicionar novo item
        const newItem = {
            id: 'item_' + Math.random().toString(36).substr(2, 9),
            produtoId,
            quantidade,
            valorUnitario
        };
        itensOrcamento.push(newItem);
    }
    
    closeModal();
    renderBudgetTable();
    showMessage('Item salvo com sucesso!');
}

// Editar item
function editItem(id) {
    const item = itensOrcamento.find(item => item.id === id);
    if (!item) return;
    
    editingItemId = id;
    
    document.getElementById('produto').value = item.produtoId;
    document.getElementById('quantidade').value = item.quantidade;
    document.getElementById('valorUnitario').value = item.valorUnitario;
    
    const modal = document.getElementById('itemModal');
    modal.classList.add('show');
}

// Excluir item
function deleteItem(id) {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    
    const index = itensOrcamento.findIndex(item => item.id === id);
    if (index !== -1) {
        itensOrcamento.splice(index, 1);
        setUserData('orcamentos', itensOrcamento);
        renderBudgetTable();
        showMessage('Item excluído com sucesso!');
    }
}

// Gerar PDF
function generatePDF() {
    const clientName = document.getElementById('clientName').value;
    const clientContact = document.getElementById('clientContact').value;
    
    if (!clientName) {
        showMessage('Informe o nome do cliente para gerar o PDF', 'danger');
        return;
    }
    
    if (itensOrcamento.length === 0) {
        showMessage('Adicione pelo menos um item ao orçamento', 'danger');
        return;
    }

    // Obter e incrementar o contador de orçamentos
    let contadorOC = parseInt(localStorage.getItem('contadorOC') || '0');
    contadorOC++;
    localStorage.setItem('contadorOC', contadorOC);
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configurações
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;
    
    // Título com número do orçamento
    doc.setFontSize(16);
    doc.text(`Orçamento Nº OC ${contadorOC}`, pageWidth / 2, y, { align: 'center' });
    y += 15;
    
    // Dados do cliente
    doc.setFontSize(12);
    doc.text(`Cliente: ${clientName}`, margin, y);
    y += 7;
    if (clientContact) {
        doc.text(`Contato: ${clientContact}`, margin, y);
        y += 7;
    }
    y += 10;
    
    // Tabela de itens
    doc.setFontSize(10);
    const headers = ['Produto', 'Qtd', 'Valor Unit.', 'Total'];
    const colWidths = [80, 20, 35, 35];
    let x = margin;
    
    // Cabeçalho da tabela
    headers.forEach((header, i) => {
        doc.text(header, x, y);
        x += colWidths[i];
    });
    y += 7;
    
    // Linha separadora
    doc.line(margin, y, pageWidth - margin, y);
    y += 7;
    
    // Dados da tabela
    itensOrcamento.forEach(item => {
        const produto = produtos.find(p => p.id === item.produtoId);
        if (!produto) return;
        
        if (y > doc.internal.pageSize.getHeight() - 30) {
            doc.addPage();
            y = 20;
        }
        
        x = margin;
        const total = item.quantidade * item.valorUnitario;
        const row = [
            produto.nome,
            item.quantidade.toString(),
            formatCurrency(item.valorUnitario),
            formatCurrency(total)
        ];
        
        row.forEach((cell, i) => {
            doc.text(cell, x, y, { maxWidth: colWidths[i] - 2 });
            x += colWidths[i];
        });
        y += 7;
    });
    
    // Linha separadora
    y += 3;
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
    
    // Total
    const total = itensOrcamento.reduce((sum, item) => 
        sum + (item.quantidade * item.valorUnitario), 0);
    
    doc.setFontSize(12);
    doc.text('Total:', pageWidth - margin - 40, y);
    doc.text(formatCurrency(total), pageWidth - margin, y, { align: 'right' });
    
    // Salvar o PDF
    const fileName = `orcamento_${clientName.toLowerCase().replace(/\s+/g, '_')}_${formatDate(new Date())}.pdf`;
    doc.save(fileName);
    showMessage('PDF gerado com sucesso!');
}

// Controles do modal
function showModal() {
    editingItemId = null;
    document.getElementById('itemForm').reset();
    document.getElementById('itemModal').classList.add('show');
}

function closeModal() {
    editingItemId = null;
    document.getElementById('itemForm').reset();
    document.getElementById('itemModal').classList.remove('show');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadBudgetData();
    
    // Botões principais
    document.getElementById('addItemBtn').addEventListener('click', showModal);
    document.getElementById('generatePdfBtn').addEventListener('click', generatePDF);
    
    // Form do item
    document.getElementById('itemForm').addEventListener('submit', saveItem);
    
    // Produto select
    document.getElementById('produto').addEventListener('change', updateUnitValue);
    
    // Fechar modal
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', closeModal);
    });
    
    // Fechar modal ao clicar fora
    window.addEventListener('click', event => {
        const modal = document.getElementById('itemModal');
        if (event.target === modal) {
            closeModal();
        }
    });
}); 