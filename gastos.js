// Expenses management
let gastosExtras = [];

function loadExpenses() {
    gastosExtras = getUserData('gastosExtras') || [];
    renderExpensesTable();
    
    // Set default date to today
    const today = new Date();
    document.getElementById('data').value = today.toISOString().split('T')[0];
    
    // Set default month filter to current month
    document.getElementById('filterMonth').value = today.toISOString().slice(0, 7);
}

function loadExpensesData() {
    gastosExtras = getUserData('gastosExtras') || [];
    
    // Limpar o filtro de mês
    document.getElementById('filterMonth').value = '';
    
    // Renderizar a tabela sem filtro
    renderExpensesTable();
}

function toggleExpenseForm(show = true) {
    const form = document.getElementById('expenseForm');
    const addBtn = document.getElementById('newExpenseBtn');
    
    form.style.display = show ? 'block' : 'none';
    addBtn.style.display = show ? 'none' : 'block';
    
    if (show) {
        // Definir a data atual ao abrir o formulário
        const today = new Date();
        document.getElementById('data').value = today.toISOString().split('T')[0];
    } else {
        document.getElementById('newExpenseForm').reset();
    }
}

function saveExpense(event) {
    event.preventDefault();
    
    const categoria = document.getElementById('categoria').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const data = document.getElementById('data').value;
    const descricao = document.getElementById('descricao').value;
    
    // Ajustar a data para meio-dia para evitar problemas com fuso horário
    const dataGasto = new Date(data + 'T12:00:00');
    
    const gasto = {
        id: 'gasto_' + Math.random().toString(36).substr(2, 9),
        categoria,
        valor,
        data: dataGasto.toISOString(),
        descricao
    };
    
    gastosExtras.push(gasto);
    setUserData('gastosExtras', gastosExtras);
    
    toggleExpenseForm(false);
    renderExpensesTable();
    showMessage('Gasto registrado com sucesso!');
}

function deleteExpense(id) {
    if (!confirm('Tem certeza que deseja excluir este gasto?')) return;
    
    const index = gastosExtras.findIndex(g => g.id === id);
    if (index !== -1) {
        gastosExtras.splice(index, 1);
        setUserData('gastosExtras', gastosExtras);
        renderExpensesTable();
        showMessage('Gasto excluído com sucesso!');
    }
}

function renderExpensesTable() {
    const tbody = document.querySelector('#expensesTable tbody');
    const searchTerm = document.getElementById('searchExpense').value.toLowerCase();
    const filterMonth = document.getElementById('filterMonth').value;
    
    let filteredExpenses = gastosExtras;
    
    // Apply month filter
    if (filterMonth) {
        const [year, month] = filterMonth.split('-').map(Number);
        filteredExpenses = filteredExpenses.filter(gasto => {
            const gastoDate = new Date(gasto.data);
            return gastoDate.getFullYear() === year && 
                   gastoDate.getMonth() === month - 1;
        });
    }
    
    // Apply search filter
    if (searchTerm) {
        filteredExpenses = filteredExpenses.filter(gasto =>
            gasto.categoria.toLowerCase().includes(searchTerm) ||
            gasto.descricao.toLowerCase().includes(searchTerm)
        );
    }
    
    // Sort by date (most recent first)
    filteredExpenses.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    tbody.innerHTML = '';
    
    let totalPeriodo = 0;
    
    filteredExpenses.forEach(gasto => {
        totalPeriodo += gasto.valor;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(gasto.data)}</td>
            <td>${gasto.categoria}</td>
            <td>${formatCurrency(gasto.valor)}</td>
            <td>${gasto.descricao || '-'}</td>
            <td class="table-actions-cell">
                <button onclick="deleteExpense('${gasto.id}')" class="action-btn delete" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    if (filteredExpenses.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="5" class="text-center">Nenhum gasto encontrado</td>';
        tbody.appendChild(tr);
    }
    
    // Update total
    document.getElementById('totalPeriodo').textContent = formatCurrency(totalPeriodo);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadExpensesData();
    
    // Event listeners para filtros
    document.getElementById('searchExpense').addEventListener('input', renderExpensesTable);
    document.getElementById('filterMonth').addEventListener('change', renderExpensesTable);
    
    // Event listener para o botão Novo Gasto
    document.getElementById('newExpenseBtn').addEventListener('click', () => toggleExpenseForm(true));
    
    // Event listener para o formulário de novo gasto
    document.getElementById('newExpenseForm').addEventListener('submit', saveExpense);
}); 