// ============================================================
//  EQUIPE TASKS — Lógica principal
// ============================================================

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const tasksRef = db.ref('tasks');

let currentUser = null;
let allTasks = {};
let currentTab = 'tasks';
let selAssignees = [];
let selPriority = 'normal';

// ── Helpers ──────────────────────────────────────────────────

function getMember(id) {
  return TEAM_MEMBERS.find(m => m.id === id);
}

function getInitials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  if (diff === -1) return 'Ontem';
  if (diff < 0) return `${Math.abs(diff)}d atrás`;
  if (diff < 7) return `Em ${diff} dias`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0,0,0,0);
  return d < today;
}

function showToast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => t.classList.remove('show'), 2800);
}

// ── Login ─────────────────────────────────────────────────────

function renderLogin() {
  const list = document.getElementById('member-list');
  list.innerHTML = TEAM_MEMBERS.map(m => `
    <button class="member-card" onclick="login('${m.id}')">
      <div class="avatar-md" style="background:${m.color};color:${m.textColor};">${getInitials(m.name)}</div>
      <div class="member-card-info">
        <span class="member-card-name">${m.name}</span>
        <span class="member-card-role">${m.role}</span>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${m.textColor}" stroke-width="2" opacity="0.5"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  `).join('');
}

function login(memberId) {
  currentUser = getMember(memberId);
  localStorage.setItem('equipe_tasks_user', memberId);
  document.getElementById('screen-login').classList.remove('active');
  document.getElementById('screen-app').classList.add('active');
  renderHeader();
  subscribeToTasks();
}

function logout() {
  localStorage.removeItem('equipe_tasks_user');
  currentUser = null;
  tasksRef.off();
  document.getElementById('screen-app').classList.remove('active');
  document.getElementById('screen-login').classList.add('active');
}

function renderHeader() {
  const initials = getInitials(currentUser.name);
  document.getElementById('hdr-avatar').textContent = initials;
  document.getElementById('hdr-avatar').style.background = currentUser.color;
  document.getElementById('hdr-avatar').style.color = currentUser.textColor;
  document.getElementById('hdr-name').textContent = currentUser.name;
}

// ── Firebase sync ─────────────────────────────────────────────

function subscribeToTasks() {
  document.getElementById('hdr-online').textContent = 'conectando...';
  tasksRef.on('value', snap => {
    allTasks = snap.val() || {};
    document.getElementById('hdr-online').textContent = `${TEAM_MEMBERS.length} online`;
    renderCurrentTab();
  }, err => {
    document.getElementById('hdr-online').textContent = 'offline';
    showToast('Sem conexão com o servidor', 'err');
  });
}

// ── Tab switching ─────────────────────────────────────────────

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tab);
  });
  document.getElementById('fab').style.display = tab === 'tasks' ? 'flex' : 'none';
  renderCurrentTab();
}

function renderCurrentTab() {
  const el = document.getElementById('main-content');
  if (currentTab === 'tasks') el.innerHTML = renderTasksTab();
  else if (currentTab === 'team') el.innerHTML = renderTeamTab();
  else el.innerHTML = renderSummaryTab();
}

// ── Tasks tab ─────────────────────────────────────────────────

let filterStatus = 'todas';

function setFilter(f) {
  filterStatus = f;
  renderCurrentTab();
}

function renderTasksTab() {
  const tasks = Object.values(allTasks);
  let visible = tasks;
  if (filterStatus === 'pendentes') visible = tasks.filter(t => !t.done);
  if (filterStatus === 'concluídas') visible = tasks.filter(t => t.done);
  visible.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const pOrder = { urgente: 0, normal: 1, baixa: 2 };
    return (pOrder[a.priority] || 1) - (pOrder[b.priority] || 1);
  });

  const filters = ['todas', 'pendentes', 'concluídas'];
  let html = `<div class="filter-row">` +
    filters.map(f => `<button class="filter-chip${filterStatus === f ? ' active' : ''}" onclick="setFilter('${f}')">${f.charAt(0).toUpperCase() + f.slice(1)}</button>`).join('') +
    `</div>`;

  if (visible.length === 0) {
    html += `<div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.3"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
      <p>Nenhuma tarefa aqui</p>
    </div>`;
  } else {
    html += visible.map(renderTaskCard).join('');
  }
  return html;
}

function renderTaskCard(task) {
  const assigneeAvatars = (task.assignees || []).map(aid => {
    const m = getMember(aid);
    if (!m) return '';
    return `<div class="avatar-xs" style="background:${m.color};color:${m.textColor};" title="${m.name}">${getInitials(m.name)}</div>`;
  }).join('');

  const doneByMember = task.doneBy ? getMember(task.doneBy) : null;
  const overdue = !task.done && isOverdue(task.due);
  const dateLabel = formatDate(task.due);
  const prioClass = { urgente: 'prio-urgente', normal: 'prio-normal', baixa: 'prio-baixa' }[task.priority] || 'prio-normal';
  const prioLabel = { urgente: '🔴 Urgente', normal: '🔵 Normal', baixa: '🟢 Baixa' }[task.priority] || '';

  return `
    <div class="task-card${task.done ? ' done' : ''}${overdue ? ' overdue' : ''}">
      <button class="check-circle${task.done ? ' checked' : ''}" onclick="toggleTask('${task.id}')" aria-label="Marcar tarefa">
        ${task.done ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
      </button>
      <div class="task-body">
        <p class="task-title">${task.title}</p>
        <div class="task-meta">
          <span class="prio-tag ${prioClass}">${prioLabel}</span>
          ${dateLabel ? `<span class="date-tag${overdue ? ' overdue-text' : ''}">${overdue ? '⚠️ ' : '📅 '}${dateLabel}</span>` : ''}
        </div>
        <div class="task-bottom">
          <div class="assignees-row">${assigneeAvatars}</div>
          ${doneByMember ? `<span class="done-badge">✓ ${doneByMember.name.split(' ')[0]}</span>` : ''}
        </div>
      </div>
    </div>`;
}

function toggleTask(taskId) {
  const task = allTasks[taskId];
  if (!task) return;
  const canToggle = (task.assignees || []).includes(currentUser.id);
  if (!canToggle) {
    showToast('Você não está atribuído a esta tarefa', 'warn');
    return;
  }
  const newDone = !task.done;
  tasksRef.child(taskId).update({
    done: newDone,
    doneBy: newDone ? currentUser.id : null,
    doneAt: newDone ? Date.now() : null
  });
  showToast(newDone ? `✓ Concluída!` : 'Reaberta');
}

// ── Team tab ──────────────────────────────────────────────────

function renderTeamTab() {
  const tasks = Object.values(allTasks);
  return TEAM_MEMBERS.map(m => {
    const assigned = tasks.filter(t => (t.assignees || []).includes(m.id));
    const done = assigned.filter(t => t.done);
    const pct = assigned.length ? Math.round(done.length / assigned.length * 100) : 0;
    const initials = getInitials(m.name);
    return `
      <div class="team-row">
        <div class="avatar-lg" style="background:${m.color};color:${m.textColor};">${initials}</div>
        <div class="team-info">
          <div class="team-name">${m.name}</div>
          <div class="team-role">${m.role}</div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
        <div class="team-stats">
          <strong>${done.length}/${assigned.length}</strong>
          <span>${pct}%</span>
        </div>
      </div>`;
  }).join('');
}

// ── Summary tab ───────────────────────────────────────────────

function renderSummaryTab() {
  const tasks = Object.values(allTasks);
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const pending = total - done;
  const urgent = tasks.filter(t => t.priority === 'urgente' && !t.done).length;
  const pct = total ? Math.round(done / total * 100) : 0;

  return `
    <div class="summary-ring-area">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" stroke-width="12"/>
        <circle cx="60" cy="60" r="50" fill="none" stroke="#1a1a2e" stroke-width="12"
          stroke-dasharray="${2 * Math.PI * 50}" stroke-dashoffset="${2 * Math.PI * 50 * (1 - pct / 100)}"
          stroke-linecap="round" transform="rotate(-90 60 60)"/>
        <text x="60" y="56" text-anchor="middle" font-size="22" font-weight="600" fill="currentColor">${pct}%</text>
        <text x="60" y="72" text-anchor="middle" font-size="11" fill="#6b7280">concluído</text>
      </svg>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-num">${total}</div><div class="stat-label">Total</div></div>
      <div class="stat-card"><div class="stat-num" style="color:#166534;">${done}</div><div class="stat-label">Concluídas</div></div>
      <div class="stat-card"><div class="stat-num">${pending}</div><div class="stat-label">Pendentes</div></div>
      <div class="stat-card"><div class="stat-num" style="color:#991b1b;">${urgent}</div><div class="stat-label">Urgentes</div></div>
    </div>
    <p class="section-label" style="margin-top:20px;">Progresso por membro</p>
    ${renderTeamTab()}
  `;
}

// ── Modal nova tarefa ─────────────────────────────────────────

function openModal() {
  selAssignees = [];
  selPriority = 'normal';
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('inp-title').value = '';
  document.getElementById('inp-due').value = today;

  ['urgente', 'normal', 'baixa'].forEach(p => {
    document.getElementById('pb-' + p).className = 'prio-btn' + (p === 'normal' ? ' active-normal' : '');
  });

  const grid = document.getElementById('assign-grid');
  grid.innerHTML = TEAM_MEMBERS.map(m => `
    <button class="assign-chip" id="chip-${m.id}" onclick="toggleAssignee('${m.id}')">
      <div class="avatar-xs" style="background:${m.color};color:${m.textColor};">${getInitials(m.name)}</div>
      ${m.name.split(' ')[0]}
    </button>
  `).join('');

  document.getElementById('modal').classList.remove('hidden');
  setTimeout(() => document.getElementById('inp-title').focus(), 300);
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

function closeModalOutside(e) {
  if (e.target.id === 'modal') closeModal();
}

function setPrio(p) {
  selPriority = p;
  const classes = { urgente: 'active-urgente', normal: 'active-normal', baixa: 'active-baixa' };
  ['urgente', 'normal', 'baixa'].forEach(x => {
    document.getElementById('pb-' + x).className = 'prio-btn' + (x === p ? ' ' + classes[x] : '');
  });
}

function toggleAssignee(id) {
  const idx = selAssignees.indexOf(id);
  if (idx > -1) selAssignees.splice(idx, 1); else selAssignees.push(id);
  TEAM_MEMBERS.forEach(m => {
    const chip = document.getElementById('chip-' + m.id);
    if (chip) chip.classList.toggle('selected', selAssignees.includes(m.id));
  });
}

function createTask() {
  const title = document.getElementById('inp-title').value.trim();
  if (!title) { document.getElementById('inp-title').focus(); showToast('Digite o título da tarefa', 'warn'); return; }
  if (selAssignees.length === 0) { showToast('Selecione ao menos um responsável', 'warn'); return; }
  const due = document.getElementById('inp-due').value;
  const newTask = {
    id: 'task_' + Date.now(),
    title,
    priority: selPriority,
    assignees: [...selAssignees],
    due,
    done: false,
    doneBy: null,
    doneAt: null,
    createdBy: currentUser.id,
    createdAt: Date.now()
  };
  tasksRef.child(newTask.id).set(newTask);
  closeModal();
  showToast('Tarefa criada e sincronizada! 🚀');
}

// ── Boot ──────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  renderLogin();
  // Auto-login se já logou antes
  const saved = localStorage.getItem('equipe_tasks_user');
  if (saved && getMember(saved)) {
    login(saved);
  }
  // FAB escondido por padrão nas outras abas
  document.getElementById('fab').style.display = 'flex';
});
