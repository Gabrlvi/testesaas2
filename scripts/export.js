// Funções de exportação de dados

// Filtrar dados por período
function getDataByPeriod(period, startDate = null, endDate = null) {
    let start, end;
    end = new Date();
    
    if (period === 'custom' && startDate && endDate) {
        // Para período personalizado, usar as datas fornecidas
        start = new Date(startDate + 'T00:00:00');
        end = new Date(endDate + 'T23:59:59.999');
    } else {
        // Para períodos predefinidos
        switch (period) {
            case 'day':
                start = new Date();
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'week':
                start = new Date();
                start.setDate(start.getDate() - 6); // -6 para incluir o dia atual
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'month':
                start = new Date();
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            default:
                throw new Error('Período inválido');
        }
    }
    
    if (start > end) {
        throw new Error('Data inicial não pode ser maior que a data final');
    }
    
    const vendas = getUserData('vendas') || [];
    const gastosExtras = getUserData('gastosExtras') || [];
    
    const filteredVendas = vendas.filter(venda => {
        const vendaDate = new Date(venda.data);
        return vendaDate >= start && vendaDate <= end;
    });
    
    const filteredGastos = gastosExtras.filter(gasto => {
        const gastoDate = new Date(gasto.data);
        return gastoDate >= start && gastoDate <= end;
    });
    
    // Calcular totais
    const totalVendas = filteredVendas.reduce((total, venda) => 
        total + (venda.precoVenda * venda.quantidade), 0);
    
    const totalCustos = filteredVendas.reduce((total, venda) => 
        total + (venda.custoUnitario * venda.quantidade), 0);
    
    const totalGastosExtras = filteredGastos.reduce((total, gasto) => 
        total + gasto.valor, 0);
    
    // Lucro líquido é apenas vendas - custos (sem considerar gastos extras)
    const lucroLiquido = totalVendas - totalCustos;
    
    return {
        vendas: filteredVendas,
        gastos: filteredGastos,
        totais: {
            vendas: totalVendas,
            custos: totalCustos,
            gastosExtras: totalGastosExtras,
            lucroLiquido: lucroLiquido
        },
        periodo: {
            inicio: start,
            fim: end
        }
    };
}

// Exportar como JSON
function exportToJSON(period, startDate, endDate) {
    const data = getDataByPeriod(period, startDate, endDate);
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const periodName = period === 'custom' 
        ? `${formatDate(data.periodo.inicio)}_a_${formatDate(data.periodo.fim)}`
        : {
            day: 'dia',
            week: 'semana',
            month: 'mes'
        }[period];
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${periodName}_${formatDate(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Exportar como PDF
async function exportToPDF(period, startDate, endDate) {
    const data = getDataByPeriod(period, startDate, endDate);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configurações
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;
    
    // Título
    doc.setFontSize(16);
    doc.text('Relatório de Vendas e Gastos', pageWidth / 2, y, { align: 'center' });
    y += 10;
    
    // Período
    doc.setFontSize(12);
    doc.text(`Período: ${formatDate(data.periodo.inicio)} a ${formatDate(data.periodo.fim)}`, pageWidth / 2, y, { align: 'center' });
    y += 20;
    
    // Resumo financeiro
    doc.setFontSize(14);
    doc.text('Resumo Financeiro', margin, y);
    y += 10;
    
    doc.setFontSize(12);
    const resumoItems = [
        ['Total de Vendas:', formatCurrency(data.totais.vendas)],
        ['Custo dos Produtos:', formatCurrency(data.totais.custos)],
        ['Gastos Extras:', formatCurrency(data.totais.gastosExtras)],
        ['Lucro Líquido:', formatCurrency(data.totais.lucroLiquido)]
    ];
    
    resumoItems.forEach(([label, value]) => {
        doc.text(label, margin, y);
        doc.text(value, pageWidth - margin, y, { align: 'right' });
        y += 8;
    });
    y += 10;
    
    // Lista de vendas
    doc.setFontSize(14);
    doc.text('Lista de Vendas', margin, y);
    y += 10;
    
    if (data.vendas.length > 0) {
        // Cabeçalho da tabela
        doc.setFontSize(10);
        const headers = ['Data', 'Produto', 'Qtd', 'Preço', 'Total'];
        const colWidths = [25, 60, 15, 30, 30];
        let x = margin;
        
        headers.forEach((header, i) => {
            doc.text(header, x, y);
            x += colWidths[i];
        });
        y += 8;
        
        // Dados da tabela
        data.vendas.forEach(venda => {
            const produto = getUserData('produtos').find(p => p.id === venda.produtoId);
            if (!produto) return;
            
            if (y > doc.internal.pageSize.getHeight() - 20) {
                doc.addPage();
                y = 20;
            }
            
            x = margin;
            const row = [
                formatDate(venda.data),
                produto.nome,
                venda.quantidade.toString(),
                formatCurrency(venda.precoVenda),
                formatCurrency(venda.precoVenda * venda.quantidade)
            ];
            
            row.forEach((cell, i) => {
                doc.text(cell, x, y, { maxWidth: colWidths[i] - 2 });
                x += colWidths[i];
            });
            y += 6;
        });
    } else {
        doc.setFontSize(12);
        doc.text('Nenhuma venda encontrada no período.', margin, y);
    }
    
    // Salvar o PDF
    const periodName = period === 'custom'
        ? `${formatDate(data.periodo.inicio)}_a_${formatDate(data.periodo.fim)}`
        : {
            day: 'dia',
            week: 'semana',
            month: 'mes'
        }[period];
    
    doc.save(`relatorio_${periodName}_${formatDate(new Date())}.pdf`);
}

// Função principal de exportação
function exportData(format) {
    try {
        const periodSelect = document.getElementById('exportPeriod');
        const period = periodSelect.value;
        let startDate = null;
        let endDate = null;
        
        if (period === 'custom') {
            startDate = document.getElementById('startDate').value;
            endDate = document.getElementById('endDate').value;
            
            if (!startDate || !endDate) {
                throw new Error('Selecione as datas inicial e final para exportar');
            }
        }
        
        switch (format) {
            case 'json':
                exportToJSON(period, startDate, endDate);
                break;
            case 'pdf':
                exportToPDF(period, startDate, endDate);
                break;
            default:
                throw new Error('Formato inválido');
        }
        showMessage('Relatório exportado com sucesso!');
    } catch (error) {
        console.error('Erro ao exportar:', error);
        showMessage(error.message || 'Erro ao exportar o relatório.', 'danger');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const exportPeriod = document.getElementById('exportPeriod');
    const customDateRange = document.getElementById('customDateRange');
    
    // Configurar data máxima como hoje
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').max = today;
    document.getElementById('endDate').max = today;
    
    // Mostrar/ocultar campos de data personalizada
    exportPeriod.addEventListener('change', () => {
        customDateRange.style.display = exportPeriod.value === 'custom' ? 'flex' : 'none';
    });
    
    // Trigger inicial
    customDateRange.style.display = exportPeriod.value === 'custom' ? 'flex' : 'none';
}); 