// Agendamentos management
let agendamentos = [];

function loadSchedules() {
    agendamentos = getUserData('agendamentos') || [];
    renderSchedulesTable();
    
    // Set default date to today
    const today = new Date();
    document.getElementById('dataAgendamento').value = today.toISOString().split('T')[0];
    
    // Set default month filter to current month
    document.getElementById('filterMonth').value = today.toISOString().slice(0, 7);
}

function loadSchedulesData() {
    agendamentos = getUserData('agendamentos') || [];
    
    // Clear month filter
    document.getElementById('filterMonth').value = '';
    
    // Render table without filter
    renderSchedulesTable();
}

function toggleScheduleForm(show = true) {
    const form = document.getElementById('scheduleForm');
    const addBtn = document.getElementById('newScheduleBtn');
    
    form.style.display = show ? 'block' : 'none';
    addBtn.style.display = show ? 'none' : 'block';
    
    if (show) {
        // Set current date when opening form
        const today = new Date();
        document.getElementById('dataAgendamento').value = today.toISOString().split('T')[0];
        
        // Set default time to current hour
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('horaAgendamento').value = `${hours}:${minutes}`;
    } else {
        document.getElementById('newScheduleForm').reset();
    }
}

function validateScheduleData(data, hora) {
    const scheduleDatetime = new Date(data + 'T' + hora);
    const now = new Date();
    
    if (scheduleDatetime < now) {
        showMessage('A data e hora do agendamento não podem ser no passado!', 'error');
        return false;
    }
    
    return true;
}

function validateContact(contato) {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Validate phone (formats: (XX)XXXXX-XXXX or XXXXXXXXXXX)
    const phoneRegex = /^\(?\d{2}\)?[\s-]?\d{5}-?\d{4}$/;
    
    if (!emailRegex.test(contato) && !phoneRegex.test(contato)) {
        showMessage('Por favor, insira um e-mail ou telefone válido!', 'error');
        return false;
    }
    
    return true;
}

function saveSchedule(event) {
    event.preventDefault();
    
    const nomeCliente = document.getElementById('nomeCliente').value.trim();
    const data = document.getElementById('dataAgendamento').value;
    const hora = document.getElementById('horaAgendamento').value;
    const contato = document.getElementById('contato').value.trim();
    
    if (!validateScheduleData(data, hora)) return;
    if (!validateContact(contato)) return;
    
    const agendamento = {
        id: 'agendamento_' + Math.random().toString(36).substr(2, 9),
        nomeCliente,
        data,
        hora,
        contato,
        dataCriacao: new Date().toISOString()
    };
    
    agendamentos.push(agendamento);
    setUserData('agendamentos', agendamentos);
    
    toggleScheduleForm(false);
    renderSchedulesTable();
    showMessage('Agendamento registrado com sucesso!');
}

function deleteSchedule(id) {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;
    
    const index = agendamentos.findIndex(a => a.id === id);
    if (index !== -1) {
        agendamentos.splice(index, 1);
        setUserData('agendamentos', agendamentos);
        renderSchedulesTable();
        showMessage('Agendamento excluído com sucesso!');
    }
}

function renderSchedulesTable() {
    const tbody = document.querySelector('#schedulesTable tbody');
    const searchTerm = document.getElementById('searchSchedule').value.toLowerCase();
    const filterMonth = document.getElementById('filterMonth').value;
    
    let filteredSchedules = agendamentos;
    
    // Apply month filter
    if (filterMonth) {
        filteredSchedules = filteredSchedules.filter(agendamento => 
            agendamento.data.startsWith(filterMonth)
        );
    }
    
    // Apply search filter
    if (searchTerm) {
        filteredSchedules = filteredSchedules.filter(agendamento =>
            agendamento.nomeCliente.toLowerCase().includes(searchTerm) ||
            agendamento.contato.toLowerCase().includes(searchTerm)
        );
    }
    
    // Sort by date and time
    filteredSchedules.sort((a, b) => {
        const dateA = new Date(a.data + 'T' + a.hora);
        const dateB = new Date(b.data + 'T' + b.hora);
        return dateA - dateB;
    });
    
    tbody.innerHTML = '';
    
    filteredSchedules.forEach(agendamento => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(agendamento.data)}</td>
            <td>${agendamento.hora}</td>
            <td>${agendamento.nomeCliente}</td>
            <td>${agendamento.contato}</td>
            <td class="table-actions-cell">
                <button onclick="deleteSchedule('${agendamento.id}')" class="action-btn delete" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    if (filteredSchedules.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="5" class="text-center">Nenhum agendamento encontrado</td>';
        tbody.appendChild(tr);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadSchedulesData();
    
    // Filter event listeners
    document.getElementById('searchSchedule').addEventListener('input', renderSchedulesTable);
    document.getElementById('filterMonth').addEventListener('change', renderSchedulesTable);
    
    // New schedule button event listener
    document.getElementById('newScheduleBtn').addEventListener('click', () => toggleScheduleForm(true));
    
    // New schedule form event listener
    document.getElementById('newScheduleForm').addEventListener('submit', saveSchedule);
}); 
