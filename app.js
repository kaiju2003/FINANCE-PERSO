const defaultState = {
  "Novembre 2026": {
    salary: 0,
    expenses: []
  }
};

let state = {};
try {
  const saved = localStorage.getItem('kaiju_finance_pure');
  state = saved ? JSON.parse(saved) : defaultState;
} catch (e) {
  state = defaultState;
}

let currentMonth = Object.keys(state)[0] || "Novembre 2026";
let qrGenerated = false;

function saveState() {
  localStorage.setItem('kaiju_finance_pure', JSON.stringify(state));
  render();
}

function formatFCFA(val) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(val || 0)) + ' FCFA';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function renderTabs() {
  const container = document.getElementById('monthTabs');
  if (!container) return;
  
  const months = Object.keys(state);
  container.innerHTML = months.map(m => `
    <button onclick="selectMonth('${m}')" class="py-2 px-5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${m === currentMonth ? 'bg-brand-emerald text-zinc-950 shadow-lg glow-effect' : 'text-zinc-400 hover:text-white bg-white/[0.02]'}">
      ${m}
    </button>
  `).join('');
}

function selectMonth(m) {
  currentMonth = m;
  const salaryForm = document.getElementById('salaryEditForm');
  if (salaryForm) salaryForm.classList.add('hidden');
  render();
}

function openNewMonthModal() {
  const modal = document.getElementById('newMonthModal');
  if (modal) {
    modal.classList.remove('hidden');
    const nameElem = document.getElementById('inputNewMonthName');
    const salElem = document.getElementById('inputNewMonthSalary');
    if (nameElem) nameElem.value = '';
    if (salElem) salElem.value = '';
  }
}

function closeNewMonthModal() {
  const modal = document.getElementById('newMonthModal');
  if (modal) modal.classList.add('hidden');
}

function createNewMonth() {
  const nameInput = document.getElementById('inputNewMonthName');
  const salaryInput = document.getElementById('inputNewMonthSalary');
  
  const name = nameInput ? nameInput.value.trim() : '';
  const salary = salaryInput ? parseFloat(salaryInput.value) : 0;

  if (!name) {
    alert("Entre un nom de mois valide !");
    return;
  }

  if (state[name]) {
    alert("Ce mois existe déjà !");
    return;
  }

  state[name] = {
    salary: isNaN(salary) ? 0 : salary,
    expenses: []
  };

  currentMonth = name;
  saveState();
  closeNewMonthModal();
}

function deleteCurrentMonth() {
  const months = Object.keys(state);
  if (months.length <= 1) {
    alert("Impossible de supprimer le dernier mois restant !");
    return;
  }

  if (confirm(`Supprimer entièrement le mois de ${currentMonth} ?`)) {
    delete state[currentMonth];
    currentMonth = Object.keys(state)[0];
    saveState();
  }
}

function toggleQRModal() {
  const modal = document.getElementById('qrModal');
  if (!modal) return;
  
  modal.classList.toggle('hidden');
  if (!modal.classList.contains('hidden') && !qrGenerated) {
    generateQRCode();
  }
}

function generateQRCode() {
  const currentUrl = window.location.href;
  const textElem = document.getElementById('qrUrlText');
  const qrElem = document.getElementById('qrcode');
  
  if (textElem) textElem.innerText = currentUrl;
  if (qrElem) {
    qrElem.innerHTML = '';
    if (typeof QRCode !== 'undefined') {
      new QRCode(qrElem, {
        text: currentUrl,
        width: 160,
        height: 160,
        colorDark: "#030507",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
      qrGenerated = true;
    }
  }
}

function openAddModal() {
  const modal = document.getElementById('addModal');
  if (modal) {
    modal.classList.remove('hidden');
    const dateInput = document.getElementById('newDate');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.value = today;
    }
    const titleElem = document.getElementById('newTitle');
    const amountElem = document.getElementById('newAmount');
    if (titleElem) titleElem.value = '';
    if (amountElem) amountElem.value = '';
  }
}

function closeAddModal() {
  const modal = document.getElementById('addModal');
  if (modal) modal.classList.add('hidden');
}

function handleNewExpense(e) {
  e.preventDefault();
  const dateInput = document.getElementById('newDate');
  const titleInput = document.getElementById('newTitle');
  const amountInput = document.getElementById('newAmount');
  const categoryInput = document.getElementById('newCategory');

  const date = dateInput ? dateInput.value : '';
  const title = titleInput ? titleInput.value.trim() : '';
  const amount = amountInput ? parseFloat(amountInput.value) : NaN;
  const category = categoryInput ? categoryInput.value : 'Dépense';

  if (!title || isNaN(amount) || !date) return;

  if (!state[currentMonth]) {
    state[currentMonth] = { salary: 0, expenses: [] };
  }

  state[currentMonth].expenses.push({ id: Date.now(), date, title, amount, category });
  saveState();
  closeAddModal();
}

function deleteExpense(id) {
  if (state[currentMonth]) {
    state[currentMonth].expenses = state[currentMonth].expenses.filter(e => e.id !== id);
    saveState();
  }
}

function updateExpenseAmount(id, val) {
  const parsed = parseFloat(val);
  if (isNaN(parsed) || !state[currentMonth]) return;
  
  const item = state[currentMonth].expenses.find(e => e.id === id);
  if (item) {
    item.amount = parsed;
    saveState();
  }
}

function toggleSalaryEdit() {
  const form = document.getElementById('salaryEditForm');
  if (form) {
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden') && state[currentMonth]) {
      const inputSal = document.getElementById('inputSalary');
      if (inputSal) inputSal.value = state[currentMonth].salary;
    }
  }
}

function saveSalary() {
  const inputSal = document.getElementById('inputSalary');
  const val = inputSal ? parseFloat(inputSal.value) : NaN;
  
  if (!isNaN(val) && val >= 0 && state[currentMonth]) {
    state[currentMonth].salary = val;
    const form = document.getElementById('salaryEditForm');
    if (form) form.classList.add('hidden');
    saveState();
  }
}

function hardResetData() {
  if (confirm('Effacer toutes les données et repartir à zéro ?')) {
    localStorage.removeItem('kaiju_finance_pure');
    state = JSON.parse(JSON.stringify(defaultState));
    currentMonth = "Novembre 2026";
    saveState();
  }
}

function render() {
  renderTabs();

  const monthData = state[currentMonth] || { salary: 0, expenses: [] };
  
  const labelElem = document.getElementById('currentMonthLabel');
  if (labelElem) labelElem.innerText = currentMonth;

  const salary = monthData.salary || 0;
  const totalExpenses = (monthData.expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
  const netBalance = salary - totalExpenses;
  const expensePercent = salary > 0 ? ((totalExpenses / salary) * 100).toFixed(1) : 0;

  const displayInc = document.getElementById('displayIncome');
  const statExp = document.getElementById('statExpenses');
  const statExpPct = document.getElementById('statExpensePercent');
  const statNet = document.getElementById('statNetBalance');
  const statStatus = document.getElementById('statStatusText');

  if (displayInc) displayInc.innerText = formatFCFA(salary);
  if (statExp) statExp.innerText = formatFCFA(totalExpenses);
  if (statExpPct) statExpPct.innerText = `${expensePercent}% du revenu`;
  if (statNet) statNet.innerText = formatFCFA(netBalance);
  
  if (statStatus) {
    if (netBalance < 0) {
      statStatus.innerText = "Attention : Déficit";
      statStatus.className = "text-[11px] text-rose-400 font-mono font-bold";
    } else {
      statStatus.innerText = "Trésorerie saine";
      statStatus.className = "text-[11px] text-teal-300 font-mono";
    }
  }

  const listContainer = document.getElementById('expenseList');
  if (listContainer) {
    if (!monthData.expenses || monthData.expenses.length === 0) {
      listContainer.innerHTML = `<div class="text-center py-8 text-xs text-zinc-500">Aucun poste enregistré pour ce mois. Clique sur "Ajouter une dépense".</div>`;
    } else {
      const sortedExpenses = [...monthData.expenses].sort((a, b) => new Date(a.date) - new Date(b.date));

      listContainer.innerHTML = sortedExpenses.map(e => `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-brand-emerald/30 transition-all group gap-3">
          <div class="flex items-center gap-3.5">
            <span class="w-2.5 h-2.5 rounded-full ${e.category === 'Abonnement' ? 'bg-brand-emerald glow-effect' : 'bg-violet-400'}"></span>
            <div>
              <div class="flex items-center gap-2">
                <p class="text-sm font-bold text-white tracking-wide">${e.title}</p>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-zinc-400">${formatDate(e.date)}</span>
              </div>
              <span class="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">${e.category}</span>
            </div>
          </div>

          <div class="flex items-center gap-3 justify-between sm:justify-end">
            <div class="ios-pill px-3.5 py-1.5 flex items-center gap-1.5">
              <input type="number" value="${e.amount}" onchange="updateExpenseAmount(${e.id}, this.value)" class="w-24 bg-transparent text-right text-xs font-mono font-extrabold text-white focus:outline-none">
              <span class="text-[10px] text-zinc-400 font-mono">FCFA</span>
            </div>

            <button onclick="deleteExpense(${e.id})" class="text-zinc-500 hover:text-rose-400 p-2 rounded-xl hover:bg-rose-500/10 transition-colors" title="Supprimer">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      `).join('');
    }
  }

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  render();
});