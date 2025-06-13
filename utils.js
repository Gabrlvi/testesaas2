// Current user management
function getCurrentUser() {
    const userJson = sessionStorage.getItem('currentUser');
    if (!userJson) return null;
    return JSON.parse(userJson);
}

function getUserPrefix() {
    const user = getCurrentUser();
    return user ? `${user.userId}_` : '';
}

// Data management
function getUserData(key) {
    const prefix = getUserPrefix();
    const data = localStorage.getItem(`${prefix}${key}`);
    return data ? JSON.parse(data) : null;
}

function setUserData(key, data) {
    const prefix = getUserPrefix();
    localStorage.setItem(`${prefix}${key}`, JSON.stringify(data));
}

// Date formatting
function formatDate(date) {
    return new Date(date).toLocaleDateString('pt-BR');
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Export/Import functionality
function exportData() {
    const prefix = getUserPrefix();
    const exportData = {
        produtos: JSON.parse(localStorage.getItem(`${prefix}produtos`) || '[]'),
        vendas: JSON.parse(localStorage.getItem(`${prefix}vendas`) || '[]'),
        gastosExtras: JSON.parse(localStorage.getItem(`${prefix}gastosExtras`) || '[]')
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `controle_vendas_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            const prefix = getUserPrefix();
            
            if (data.produtos) setUserData('produtos', data.produtos);
            if (data.vendas) setUserData('vendas', data.vendas);
            if (data.gastosExtras) setUserData('gastosExtras', data.gastosExtras);
            
            showMessage('Dados importados com sucesso!');
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            showMessage('Erro ao importar dados. Verifique o arquivo.', 'danger');
        }
    };
    reader.readAsText(file);
}

// UI helpers
function showMessage(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Remove any existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Add new alert to the top of the main content
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(alertDiv, mainContent.firstChild);
    
    // Remove alert after 3 seconds
    setTimeout(() => alertDiv.remove(), 3000);
}

// Mobile sidebar toggle
function setupSidebar() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
}

// Setup common event listeners
document.addEventListener('DOMContentLoaded', () => {
    setupSidebar();
    
    // Setup export/import buttons
    const exportBtn = document.getElementById('exportData');
    const importBtn = document.getElementById('importInput');
    const importTrigger = document.getElementById('importData');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    if (importBtn && importTrigger) {
        importTrigger.addEventListener('click', () => importBtn.click());
        importBtn.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                importData(e.target.files[0]);
            }
        });
    }
    
    // Setup logout button
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    }
    
    // Display username if available
    const usernameElement = document.getElementById('username');
    const currentUser = getCurrentUser();
    if (usernameElement && currentUser) {
        usernameElement.textContent = currentUser.username;
    }
}); 