// script/kanban.js
const API = 'http://localhost:3000/api';

/* ========== AUTH HEADERS ========== */
function getAuthHeaders() {
  const token = localStorage.getItem('devplanner_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/* ========== ELEMENTOS ========== */
const taskProjectSelect = document.getElementById('task-project');
const taskOwnerSelect   = document.getElementById('task-owner');
const historyTasksDiv   = document.getElementById('history-tasks');
let editTaskId = null;

/* ========== HELPERS DOM ========== */
function el(tag, attrs = {}, html = '') {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') e.className = v;
    else if (k === 'style') Object.assign(e.style, v);
    else if (k.startsWith('data-')) e.setAttribute(k, v);
    else e[k] = v;
  });
  if (html) e.innerHTML = html;
  return e;
}

/* ====== RESET DO FORM DA MODAL ====== */
function resetTaskForm() {
  const title    = document.getElementById('task-title');
  const desc     = document.getElementById('task-desc');
  const date     = document.getElementById('task-date');
  const priority = document.getElementById('task-priority');
  const type     = document.getElementById('task-type');
  const owner    = document.getElementById('task-owner');
  const project  = document.getElementById('task-project');

  if (title)    title.value = '';
  if (desc)     desc.value = '';
  if (date)     date.value = '';

  if (priority) priority.value = 'Média';
  if (type)     type.value = 'Desenvolvimento';

  if (owner && owner.options.length)   owner.selectedIndex   = 0;
  if (project && project.options.length) project.selectedIndex = 0;

  // força defaults sensatos
  if (project && project.options.length) {
    const optTrabalho = [...project.options].find(o => o.value === 'Trabalho');
    if (optTrabalho) project.value = 'Trabalho';
  }
  if (owner && owner.options.length) {
    const optAluno1 = [...owner.options].find(o => o.value === 'Aluno 1');
    if (optAluno1) owner.value = 'Aluno 1';
  }

  // botões de edição desativados em "novo"
  try { document.getElementById('finish-task-btn').disabled = true; } catch {}
  try { document.getElementById('delete-task-btn').disabled = true; } catch {}
}
function enableEditButtons() {
  try { document.getElementById('finish-task-btn').disabled = false; } catch {}
  try { document.getElementById('delete-task-btn').disabled = false; } catch {}
}

/* ========== CARD UI ========== */
function renderTaskCard(task) {
  const difficulty = task.difficulty || task.priority || 'Média';
  const status = task.status || 'todo';

  const card = el('div', {
    class: 'task-card',
    id: `task-${task.id}`,
    draggable: true
  });

  card.dataset.type = task.type || 'Geral';
  card.dataset.difficulty = difficulty;
  card.dataset.priority = task.priority || difficulty;

  card.innerHTML = `
    <strong>${task.title || 'Sem título'}</strong>
    <p>${task.desc || ''}</p>
  `;

  card.ondragstart = e => drag(e);

  // abrir em modo edição
  card.addEventListener('dblclick', () => {
    editTaskId = task.id;

    document.getElementById('task-title').value = task.title || '';
    document.getElementById('task-desc').value  = task.desc || '';
    document.getElementById('task-date').value  = task.date || '';
    document.getElementById('task-priority').value = task.priority || 'Média';
    document.getElementById('task-type').value     = task.type || 'Desenvolvimento';
    try { document.getElementById('task-owner').value = task.owner || ''; } catch {}
    try { document.getElementById('task-project').value = task.project || ''; } catch {}

    enableEditButtons();
    openModal(); // não limpa porque editTaskId != null
  });

  return { card, status };
}

/* ========== USERS & PROJECTS ========== */
async function fetchUsersAndProjects() {
  try {
    // USERS
    const uRes = await fetch(`${API}/users`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    let users = await uRes.json();

    // fallback + dedupe por nome
    const baseUsers = [{ name: 'Aluno 1' }, { name: 'Aluno 2' }, { name: 'Aluno 3' }];
    const usersByName = new Map();
    [...baseUsers, ...(Array.isArray(users) ? users : [])].forEach(u => {
      if (u && u.name) usersByName.set(u.name, { name: u.name });
    });
    users = Array.from(usersByName.values());

    // PROJECTS
    const pRes = await fetch(`${API}/projects?t=${Date.now()}`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    let projects = await pRes.json();

    const baseProjects = [{ name: 'Trabalho' }, { name: 'AEP' }];
    const projByName = new Map();
    [...baseProjects, ...(Array.isArray(projects) ? projects : [])].forEach(p => {
      if (p && p.name) projByName.set(p.name, { name: p.name });
    });
    projects = Array.from(projByName.values());

    // popula selects
    taskOwnerSelect.innerHTML   = users.map(u => `<option value="${u.name}">${u.name}</option>`).join('');
    taskProjectSelect.innerHTML = projects.map(p => `<option value="${p.name}">${p.name}</option>`).join('');

    // defaults
    const idxAluno1   = Array.from(taskOwnerSelect.options).findIndex(o => o.value === 'Aluno 1');
    if (idxAluno1 >= 0) taskOwnerSelect.selectedIndex = idxAluno1;

    const idxTrabalho = Array.from(taskProjectSelect.options).findIndex(o => o.value === 'Trabalho');
    if (idxTrabalho >= 0) taskProjectSelect.selectedIndex = idxTrabalho;

  } catch (err) {
    console.error('Erro ao buscar users/projects:', err);

    // fallback hardcore se a API cair
    taskOwnerSelect.innerHTML = `
      <option value="Aluno 1">Aluno 1</option>
      <option value="Aluno 2">Aluno 2</option>
      <option value="Aluno 3">Aluno 3</option>
    `;
    taskProjectSelect.innerHTML = `
      <option value="Trabalho">Trabalho</option>
      <option value="AEP">AEP</option>
      <option value="Projeto Exemplo">Projeto Exemplo</option>
    `;
  }
}

/* ========== TASKS (READ) ========== */
async function fetchTasksFromAPI() {
  try {
    const res = await fetch(`${API}/tasks`, { headers: getAuthHeaders() });
    const tasks = await res.json();

    ['todo','doing','review','done'].forEach(id => {
      const col = document.getElementById(id);
      const title = col.querySelector('h3')?.textContent || '';
      col.innerHTML = `<h3>${title}</h3>`;
    });

    tasks
      .filter(t => (t.status || 'todo') !== 'done')
      .forEach(task => {
        const { card, status } = renderTaskCard(task);
        const col = document.getElementById(status || 'todo');
        if (col) col.appendChild(card);
      });
  } catch (err) {
    console.error('Erro ao buscar tasks:', err);
  }
}

/* ========== TASKS (CREATE/UPDATE) ========== */
async function addTask() {
  const title    = document.getElementById('task-title').value;
  const desc     = document.getElementById('task-desc').value;
  const date     = document.getElementById('task-date').value;
  const priority = document.getElementById('task-priority').value;
  const type     = document.getElementById('task-type').value;
  const owner    = document.getElementById('task-owner').value;
  const project  = document.getElementById('task-project').value;

  const payload = { title, desc, date, priority, type, owner, project };

  try {
    const res = editTaskId
      ? await fetch(`${API}/tasks/${editTaskId}`, {
          method:'PUT',
          headers: Object.assign({ 'Content-Type':'application/json' }, getAuthHeaders()),
          body: JSON.stringify(payload)
        })
      : await fetch(`${API}/tasks`, {
          method:'POST',
          headers: Object.assign({ 'Content-Type':'application/json' }, getAuthHeaders()),
          body: JSON.stringify(payload)
        });

    const data = await res.json();
    if (res.ok) {
      editTaskId = null;
      fetchTasksFromAPI();
      closeModal();
    } else {
      alert(data.error || 'Erro ao salvar tarefa');
    }
  } catch (err) {
    console.error('Erro ao adicionar tarefa:', err);
  }
}

/* ========== TASKS (DELETE) ========== */
async function deleteTask() {
  if (!editTaskId) return;
  try {
    const res = await fetch(`${API}/tasks/${editTaskId}`, {
      method:'DELETE',
      headers: getAuthHeaders()
    });
    if (res.ok) {
      editTaskId = null;
      fetchTasksFromAPI();
      closeModal();
    } else {
      alert('Erro ao excluir tarefa');
    }
  } catch (err) {
    console.error('Erro ao deletar tarefa:', err);
  }
}

/* ========== TASKS (FINISH) ========== */
async function finishTask() {
  if (!editTaskId) return;
  try {
    const res = await fetch(`${API}/tasks/${editTaskId}/status`, {
      method:'PATCH',
      headers: Object.assign({ 'Content-Type':'application/json' }, getAuthHeaders()),
      body: JSON.stringify({ status:'done' })
    });

    if (res.ok) {
      const el = document.getElementById(`task-${editTaskId}`);
      if (el) el.remove();
      editTaskId = null;
      closeModal();
    }
  } catch (err) {
    console.error('Erro ao finalizar tarefa:', err);
  }
}

/* ========== DRAG & DROP ========== */
function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { ev.dataTransfer.setData('text', ev.target.id); }

async function drop(ev) {
  ev.preventDefault();
  const draggedId = ev.dataTransfer.getData('text');
  const id = draggedId.replace('task-','');
  const newStatus = ev.currentTarget.id;

  const card = document.getElementById(draggedId);
  if (card) ev.currentTarget.appendChild(card);

  try {
    const res = await fetch(`${API}/tasks/${id}/status`, {
      method:'PATCH',
      headers: Object.assign({ 'Content-Type':'application/json' }, getAuthHeaders()),
      body: JSON.stringify({ status:newStatus })
    });
    if (!res.ok) fetchTasksFromAPI();
  } catch (err) {
    console.error('Erro ao mover tarefa:', err);
    fetchTasksFromAPI();
  }
}

/* ========== HISTÓRICO ========== */
async function openHistoryModal() {
  historyTasksDiv.innerHTML = '<p style="opacity:.7">Carregando histórico...</p>';
  try {
    const res = await fetch(`${API}/tasks`, { headers: getAuthHeaders() });
    const tasks = await res.json();
    const done = tasks.filter(t => (t.status || '') === 'done');

    historyTasksDiv.innerHTML = '';
    if (!done.length) {
      historyTasksDiv.innerHTML = '<p style="opacity:.7">Nenhuma tarefa finalizada ainda.</p>';
    } else {
      done.forEach(task => {
        const { card } = renderTaskCard(task);
        card.draggable = false;
        card.classList.add('task-card--history');
        historyTasksDiv.appendChild(card);
      });
    }
  } catch (err) {
    console.error('Erro ao carregar histórico:', err);
    historyTasksDiv.innerHTML = '<p style="color:#b3261e">Falha ao carregar histórico.</p>';
  }

  document.getElementById('history-modal').classList.add('is-open');
  document.body.classList.add('modal-open');
}

function closeHistoryModal() {
  document.getElementById('history-modal').classList.remove('is-open');
  document.body.classList.remove('modal-open');
}

/* ========== MODAL TAREFA ========== */
// Se abrir via botão "Nova Tarefa", editTaskId está null -> limpa
function openModal() {
  if (editTaskId == null) resetTaskForm();
  document.getElementById('task-modal').classList.add('is-open');
  document.body.classList.add('modal-open');
}
function closeModal() {
  document.getElementById('task-modal').classList.remove('is-open');
  document.body.classList.remove('modal-open');
  editTaskId = null;
  resetTaskForm(); // deixa limpinho pro próximo clique
}

/* ========== LOGOUT ========== */
function logout() {
  localStorage.removeItem('devplanner_token');
  localStorage.removeItem('devplanner_user');
  window.location.href = '/html/login.html';
}

/* ========== BOOT ========== */
window.addEventListener('load', () => {
  fetchUsersAndProjects();
  fetchTasksFromAPI();
});
