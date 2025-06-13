// Resumo (Summary) page functionality
let vendas = [];
let produtos = [];
let gastosExtras = [];
let charts = {
    vendasGastos: null,
    produtos: null,
    gastos: null,
    lucro: null
};

function loadSummaryData() {
    vendas = getUserData('vendas') || [];
    produtos = getUserData('produtos') || [];
    gastosExtras = getUserData('gastosExtras') || [];
    
    updateSummaryCards();
    updateCharts();
    updateProductsTable();
}

function getDataForPeriod(days) {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // Fim do dia atual
    
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0); // Início do primeiro dia
    
    const filteredVendas = vendas.filter(venda => {
        const vendaDate = new Date(venda.data);
        vendaDate.setHours(0, 0, 0, 0);
        return vendaDate >= startDate && vendaDate <= endDate;
    });
    
    const filteredGastos = gastosExtras.filter(gasto => {
        const gastoDate = new Date(gasto.data);
        gastoDate.setHours(0, 0, 0, 0);
        return gastoDate >= startDate && gastoDate <= endDate;
    });
    
    return { filteredVendas, filteredGastos, startDate, endDate };
}

function updateSummaryCards() {
    const period = parseInt(document.getElementById('period').value);
    const { filteredVendas, filteredGastos } = getDataForPeriod(period);
    
    // Calcular totais
    const totalVendas = filteredVendas.reduce((total, venda) => 
        total + (venda.precoVenda * venda.quantidade), 0);
    
    const custoProdutos = filteredVendas.reduce((total, venda) => 
        total + (venda.custoUnitario * venda.quantidade), 0);
    
    const totalGastosExtras = filteredGastos.reduce((total, gasto) => 
        total + gasto.valor, 0);
    
    const lucroLiquido = totalVendas - custoProdutos;
    
    // Atualizar cards
    document.getElementById('totalVendas').textContent = formatCurrency(totalVendas);
    document.getElementById('custoProdutos').textContent = formatCurrency(custoProdutos);
    document.getElementById('gastosExtras').textContent = formatCurrency(totalGastosExtras);
    document.getElementById('lucroLiquido').textContent = formatCurrency(lucroLiquido);
}

function updateCharts() {
    const period = parseInt(document.getElementById('period').value);
    const { filteredVendas, filteredGastos } = getDataForPeriod(period);
    
    updateVendasGastosChart(filteredVendas, filteredGastos);
    updateProdutosChart(filteredVendas);
    updateGastosChart(filteredGastos);
    updateLucroChart(filteredVendas, filteredGastos);
}

function updateVendasGastosChart(filteredVendas, filteredGastos) {
    const ctx = document.getElementById('vendasGastosChart').getContext('2d');
    
    if (charts.vendasGastos) {
        charts.vendasGastos.destroy();
    }
    
    // Criar array de todas as datas no período
    const period = parseInt(document.getElementById('period').value);
    const { startDate, endDate } = getDataForPeriod(period);
    const datas = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        datas.push(formatDate(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Agrupar dados por data
    const vendasPorData = {};
    const gastosPorData = {};
    
    filteredVendas.forEach(venda => {
        const data = formatDate(venda.data);
        vendasPorData[data] = (vendasPorData[data] || 0) + (venda.precoVenda * venda.quantidade);
    });
    
    filteredGastos.forEach(gasto => {
        const data = formatDate(gasto.data);
        gastosPorData[data] = (gastosPorData[data] || 0) + gasto.valor;
    });
    
    charts.vendasGastos = new Chart(ctx, {
        type: 'line',
        data: {
            labels: datas,
            datasets: [
                {
                    label: 'Vendas',
                    data: datas.map(data => vendasPorData[data] || 0),
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    fill: true
                },
                {
                    label: 'Gastos',
                    data: datas.map(data => gastosPorData[data] || 0),
                    borderColor: '#F44336',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => formatCurrency(value)
                    }
                }
            }
        }
    });
}

function updateProdutosChart(filteredVendas) {
    const ctx = document.getElementById('produtosChart').getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (charts.produtos) {
        charts.produtos.destroy();
    }
    
    // Agrupar vendas por produto
    const vendasPorProduto = {};
    filteredVendas.forEach(venda => {
        const produto = produtos.find(p => p.id === venda.produtoId);
        if (produto) {
            if (!vendasPorProduto[produto.nome]) {
                vendasPorProduto[produto.nome] = {
                    quantidade: 0,
                    valor: 0
                };
            }
            vendasPorProduto[produto.nome].quantidade += venda.quantidade;
            vendasPorProduto[produto.nome].valor += venda.quantidade * venda.precoVenda;
        }
    });
    
    // Ordenar por valor total e pegar os 5 mais vendidos
    const topProdutos = Object.entries(vendasPorProduto)
        .sort(([, a], [, b]) => b.valor - a.valor)
        .slice(0, 5);
    
    charts.produtos = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topProdutos.map(([nome]) => nome),
            datasets: [
                {
                    label: 'Valor Total',
                    data: topProdutos.map(([, data]) => data.valor),
                    backgroundColor: '#2196F3'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => formatCurrency(value)
                    }
                }
            }
        }
    });
}

function updateGastosChart(filteredGastos) {
    const ctx = document.getElementById('gastosChart').getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (charts.gastos) {
        charts.gastos.destroy();
    }
    
    // Agrupar gastos por categoria
    const gastosPorCategoria = {};
    filteredGastos.forEach(gasto => {
        if (!gastosPorCategoria[gasto.categoria]) {
            gastosPorCategoria[gasto.categoria] = 0;
        }
        gastosPorCategoria[gasto.categoria] += gasto.valor;
    });
    
    const categorias = Object.keys(gastosPorCategoria);
    const valores = Object.values(gastosPorCategoria);
    
    charts.gastos = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categorias,
            datasets: [{
                data: valores,
                backgroundColor: [
                    '#FFC107',
                    '#9C27B0',
                    '#FF5722',
                    '#795548',
                    '#607D8B'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: context => {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function updateLucroChart(filteredVendas, filteredGastos) {
    const ctx = document.getElementById('lucroChart').getContext('2d');
    
    if (charts.lucro) {
        charts.lucro.destroy();
    }
    
    // Criar array de todas as datas no período
    const period = parseInt(document.getElementById('period').value);
    const { startDate, endDate } = getDataForPeriod(period);
    const datas = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        datas.push(formatDate(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Agrupar dados por data
    const lucroPorData = {};
    datas.forEach(data => {
        lucroPorData[data] = {
            vendas: 0,
            custos: 0
        };
    });
    
    filteredVendas.forEach(venda => {
        const data = formatDate(venda.data);
        lucroPorData[data].vendas += venda.precoVenda * venda.quantidade;
        lucroPorData[data].custos += venda.custoUnitario * venda.quantidade;
    });
    
    const lucros = datas.map(data => {
        const { vendas, custos } = lucroPorData[data];
        return vendas - custos;
    });
    
    charts.lucro = new Chart(ctx, {
        type: 'line',
        data: {
            labels: datas,
            datasets: [{
                label: 'Lucro Líquido',
                data: lucros,
                borderColor: '#9C27B0',
                backgroundColor: 'rgba(156, 39, 176, 0.1)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    ticks: {
                        callback: value => formatCurrency(value)
                    }
                }
            }
        }
    });
}

function updateProductsTable() {
    const period = parseInt(document.getElementById('period').value);
    const { filteredVendas } = getDataForPeriod(period);
    
    // Agrupar vendas por produto
    const vendasPorProduto = {};
    filteredVendas.forEach(venda => {
        if (!vendasPorProduto[venda.produtoId]) {
            vendasPorProduto[venda.produtoId] = {
                quantidade: 0,
                totalVendido: 0,
                custoTotal: 0
            };
        }
        vendasPorProduto[venda.produtoId].quantidade += venda.quantidade;
        vendasPorProduto[venda.produtoId].totalVendido += venda.quantidade * venda.precoVenda;
        vendasPorProduto[venda.produtoId].custoTotal += venda.quantidade * venda.custoUnitario;
    });
    
    const tbody = document.querySelector('#produtosTable tbody');
    tbody.innerHTML = '';
    
    Object.entries(vendasPorProduto).forEach(([produtoId, dados]) => {
        const produto = produtos.find(p => p.id === produtoId);
        if (!produto) return;
        
        const lucro = dados.totalVendido - dados.custoTotal;
        const margem = ((lucro / dados.custoTotal) * 100).toFixed(1);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${produto.nome}</td>
            <td>${dados.quantidade}</td>
            <td>${formatCurrency(dados.totalVendido)}</td>
            <td>${formatCurrency(dados.custoTotal)}</td>
            <td>${formatCurrency(lucro)}</td>
            <td>${margem}%</td>
        `;
        tbody.appendChild(tr);
    });
    
    if (Object.keys(vendasPorProduto).length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="6" class="text-center">Nenhuma venda no período</td>';
        tbody.appendChild(tr);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadSummaryData();
    
    const periodSelect = document.getElementById('period');
    periodSelect.addEventListener('change', () => {
        updateSummaryCards();
        updateCharts();
        updateProductsTable();
    });
}); 