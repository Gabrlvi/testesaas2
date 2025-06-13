// Dashboard data management
function loadDashboardData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const vendas = getUserData('vendas') || [];
    const gastosExtras = getUserData('gastosExtras') || [];
    const produtos = getUserData('produtos') || [];
    
    // Filter today's data
    const vendasHoje = vendas.filter(venda => {
        const vendaDate = new Date(venda.data);
        vendaDate.setHours(0, 0, 0, 0);
        return vendaDate.getTime() === today.getTime();
    });
    
    const gastosHoje = gastosExtras.filter(gasto => {
        const gastoDate = new Date(gasto.data);
        gastoDate.setHours(0, 0, 0, 0);
        return gastoDate.getTime() === today.getTime();
    });
    
    // Calculate statistics
    const totalVendas = vendasHoje.reduce((total, venda) => total + (venda.precoVenda * venda.quantidade), 0);
    const totalCustos = vendasHoje.reduce((total, venda) => total + (venda.custoUnitario * venda.quantidade), 0);
    const lucroLiquido = totalVendas - totalCustos;
    const totalGastos = gastosHoje.reduce((total, gasto) => total + gasto.valor, 0);
    
    // Find most sold product today
    const vendasPorProduto = {};
    vendasHoje.forEach(venda => {
        if (!vendasPorProduto[venda.produtoId]) {
            vendasPorProduto[venda.produtoId] = 0;
        }
        vendasPorProduto[venda.produtoId] += venda.quantidade;
    });
    
    let produtoMaisVendido = '-';
    let maiorQuantidade = 0;
    
    Object.entries(vendasPorProduto).forEach(([produtoId, quantidade]) => {
        if (quantidade > maiorQuantidade) {
            maiorQuantidade = quantidade;
            const produto = produtos.find(p => p.id === produtoId);
            if (produto) {
                produtoMaisVendido = `${produto.nome} (${quantidade}x)`;
            }
        }
    });
    
    // Update UI
    document.getElementById('lucroDia').textContent = formatCurrency(lucroLiquido);
    document.getElementById('vendasDia').textContent = vendasHoje.length;
    document.getElementById('produtoMaisVendido').textContent = produtoMaisVendido;
    document.getElementById('gastosDia').textContent = formatCurrency(totalGastos);
    
    // Update tables
    updateVendasTable(vendas.slice(-5).reverse());
    updateGastosTable(gastosExtras.slice(-5).reverse());
}

function updateVendasTable(vendas) {
    const tbody = document.querySelector('#ultimasVendas tbody');
    const produtos = getUserData('produtos') || [];
    tbody.innerHTML = '';
    
    vendas.forEach(venda => {
        const produto = produtos.find(p => p.id === venda.produtoId);
        if (!produto) return;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(venda.data)}</td>
            <td>${produto.nome}</td>
            <td>${venda.quantidade}</td>
            <td>${formatCurrency(venda.precoVenda * venda.quantidade)}</td>
        `;
        tbody.appendChild(tr);
    });
    
    if (vendas.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="4" class="text-center">Nenhuma venda registrada</td>';
        tbody.appendChild(tr);
    }
}

function updateGastosTable(gastos) {
    const tbody = document.querySelector('#ultimosGastos tbody');
    tbody.innerHTML = '';
    
    gastos.forEach(gasto => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(gasto.data)}</td>
            <td>${gasto.categoria}</td>
            <td>${formatCurrency(gasto.valor)}</td>
        `;
        tbody.appendChild(tr);
    });
    
    if (gastos.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="3" class="text-center">Nenhum gasto registrado</td>';
        tbody.appendChild(tr);
    }
}

function clearAllData() {
    if (!confirm('Tem certeza que deseja apagar todos os dados? Esta ação não pode ser desfeita.')) return;
    
    if (!confirm('ATENÇÃO: Todos os dados serão perdidos! Confirma a exclusão?')) return;
    
    const prefix = getUserPrefix();
    localStorage.removeItem(`${prefix}produtos`);
    localStorage.removeItem(`${prefix}vendas`);
    localStorage.removeItem(`${prefix}gastosExtras`);
    localStorage.removeItem(`${prefix}agendamentos`);
    localStorage.removeItem(`${prefix}orcamentos`);
    localStorage.removeItem('contadorOC');
    
    showMessage('Todos os dados foram apagados com sucesso!');
    setTimeout(() => {
        window.location.reload();
    }, 1500);
}

// Load dashboard data when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    
    // Setup clear data button
    const clearDataBtn = document.getElementById('clearData');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', clearAllData);
    }
}); 