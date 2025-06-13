// Utility functions
function showMessage(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Remove any existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Add new alert before the form
    const activeForm = document.querySelector('.auth-form:not([style*="display: none"])');
    activeForm.insertBefore(alertDiv, activeForm.firstChild);
    
    // Remove alert after 3 seconds
    setTimeout(() => alertDiv.remove(), 3000);
}

function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

// Authentication functions
function register() {
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!username || !password || !confirmPassword) {
        showMessage('Por favor, preencha todos os campos', 'danger');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('As senhas não coincidem', 'danger');
        return;
    }
    
    let users = [];
    try {
        users = JSON.parse(localStorage.getItem('users') || '[]');
    } catch (e) {
        users = [];
    }
    
    if (users.find(u => u.email === username)) {
        showMessage('Este usuário já existe', 'danger');
        return;
    }
    
    const userId = generateUserId();
    const newUser = {
        email: username,
        password: password,
        userId: userId
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Initialize user data structures
    const userPrefix = `${userId}_`;
    localStorage.setItem(`${userPrefix}produtos`, '[]');
    localStorage.setItem(`${userPrefix}vendas`, '[]');
    localStorage.setItem(`${userPrefix}gastosExtras`, '[]');
    
    showMessage('Cadastro realizado com sucesso!');
    setTimeout(() => {
        toggleForms();
        document.getElementById('username').value = username;
        document.getElementById('password').value = '';
    }, 1500);
}

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showMessage('Por favor, preencha todos os campos', 'danger');
        return;
    }
    
    let users = [];
    try {
        users = JSON.parse(localStorage.getItem('users') || '[]');
    } catch (e) {
        users = [];
    }
    
    const user = users.find(u => u.email === username && u.password === password);
    
    if (!user) {
        showMessage('Usuário ou senha incorretos', 'danger');
        return;
    }
    
    // Store current user info in sessionStorage
    sessionStorage.setItem('currentUser', JSON.stringify({
        username: user.email,
        userId: user.userId || generateUserId() // Fallback for older accounts
    }));
    
    showMessage('Login realizado com sucesso!');
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1500);
}

// Check if user is already logged in
function checkAuth() {
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser && window.location.pathname.endsWith('index.html')) {
        window.location.href = 'dashboard.html';
    } else if (!currentUser && !window.location.pathname.endsWith('index.html')) {
        window.location.href = 'index.html';
    }
}

// Run auth check when page loads
window.addEventListener('load', checkAuth); 