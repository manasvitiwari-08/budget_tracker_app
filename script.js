// ============================ DATA ============================
let transactions = [];
let budgets = {};

// ============================ DOM Elements ============================
const form = document.getElementById('transaction-form');
const descInput = document.getElementById('desc');
const amountInput = document.getElementById('amount');
const typeSelect = document.getElementById('type');
const categorySelect = document.getElementById('category');
const recurringCheckbox = document.getElementById('recurring');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const balanceEl = document.getElementById('balance');
const transactionList = document.getElementById('transaction-list');
const budgetList = document.getElementById('budget-list');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');
const voiceBtn = document.getElementById('voice-btn');
const themeToggle = document.getElementById('theme-toggle');
const billList = document.getElementById('bill-list');
const editBudgetsBtn = document.getElementById('edit-budgets-btn');
const budgetEditForm = document.getElementById('budget-edit-form');
const budgetInputs = document.getElementById('budget-inputs');
const saveBudgetsBtn = document.getElementById('save-budgets-btn');
const cancelBudgetsBtn = document.getElementById('cancel-budgets-btn');

let expenseChart; // Chart.js instance

// ============================ Helper Functions ============================

// Format amount as Indian Rupees
function formatINR(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// Get transactions from current month only
function getCurrentMonthTransactions() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    return transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth;
    });
}

// Calculate totals (income, expense, balance)
function calculateTotals() {
    let income = 0, expense = 0;
    transactions.forEach(t => {
        if (t.type === 'income') income += t.amount;
        else expense += t.amount;
    });
    return { income, expense, balance: income - expense };
}

// ============================ Storage Functions ============================

function saveTransactionsToStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function loadTransactionsFromStorage() {
    const stored = localStorage.getItem('transactions');
    if (stored) {
        transactions = JSON.parse(stored);
    } else {
        // Dummy data for first run
        const today = new Date().toISOString().slice(0,10);
        transactions = [
            { id: Date.now() - 100000, description: 'Salary', amount: 3000, type: 'income', category: 'Other', date: today, recurring: false },
            { id: Date.now() - 200000, description: 'Groceries', amount: 150, type: 'expense', category: 'Food', date: today, recurring: false },
            { id: Date.now() - 300000, description: 'Gas', amount: 40, type: 'expense', category: 'Transport', date: today, recurring: false }
        ];
    }
}

function saveBudgetsToStorage() {
    localStorage.setItem('budgets', JSON.stringify(budgets));
}

function loadBudgetsFromStorage() {
    const stored = localStorage.getItem('budgets');
    if (stored) {
        budgets = JSON.parse(stored);
    } else {
        budgets = {
            Food: 300,
            Transport: 100,
            Entertainment: 150,
            Bills: 200,
            Other: 100
        };
    }
}

// ============================ Recurring Transactions ============================
function checkAndAddRecurring() {
    const lastMonth = localStorage.getItem('lastMonth');
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`; // e.g., "2025-3"

    if (lastMonth && lastMonth !== currentMonthKey) {
        // Month changed – add recurring transactions from previous months
        const recurringTxs = transactions.filter(t => t.recurring);
        recurringTxs.forEach(t => {
            // Avoid duplicates: check if a similar transaction already exists this month
            const existsThisMonth = transactions.some(ex => 
                ex.date.startsWith(now.toISOString().slice(0,7)) && // same year-month
                ex.description === t.description &&
                ex.amount === t.amount &&
                ex.category === t.category
            );
            if (!existsThisMonth) {
                const newTx = {
                    ...t,
                    id: Date.now() + Math.random(),
                    date: now.toISOString().slice(0,10)
                };
                transactions.push(newTx);
            }
        });
        saveTransactionsToStorage();
    }

    // Update last month
    localStorage.setItem('lastMonth', currentMonthKey);
}

// ============================ UI Update Functions ============================

function updateSummary() {
    const { income, expense, balance } = calculateTotals();
    totalIncomeEl.textContent = formatINR(income);
    totalExpenseEl.textContent = formatINR(expense);
    balanceEl.textContent = formatINR(balance);
}

function renderTransactions() {
    // Sort by date descending (newest first)
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    transactionList.innerHTML = '';
    sorted.forEach(t => {
        const li = document.createElement('li');
        li.className = 'transaction-item';
        li.innerHTML = `
            <div class="transaction-info">
                <span class="transaction-category">${t.category}</span>
                <span>${t.description}</span>
                <span>${t.date}</span>
                ${t.recurring ? '<span class="recurring-badge" title="Recurring monthly">🔄</span>' : ''}
            </div>
            <div>
                <span class="transaction-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${formatINR(t.amount)}</span>
                <button class="delete-btn" data-id="${t.id}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        transactionList.appendChild(li);
    });

    // Add delete event listeners
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = Number(btn.dataset.id);
            deleteTransaction(id);
        });
    });
}

function renderBudgets() {
    const monthTxs = getCurrentMonthTransactions();
    const expenseByCategory = {};
    monthTxs.filter(t => t.type === 'expense').forEach(t => {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    });

    budgetList.innerHTML = '';
    for (let [cat, limit] of Object.entries(budgets)) {
        const spent = expenseByCategory[cat] || 0;
        const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
        const exceeded = spent > limit;

        const item = document.createElement('div');
        item.className = 'budget-item';
        item.innerHTML = `
            <div class="budget-category">
                <span>${cat}</span>
                <span>${formatINR(spent)} / ${formatINR(limit)}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill ${exceeded ? 'exceeded' : ''}" style="width: ${percent}%;"></div>
            </div>
        `;
        budgetList.appendChild(item);
    }
}

function updateChart() {
    const monthTxs = getCurrentMonthTransactions();
    const expenseByCategory = {};
    monthTxs.filter(t => t.type === 'expense').forEach(t => {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    });

    const categories = Object.keys(expenseByCategory);
    const amounts = Object.values(expenseByCategory);

    if (expenseChart) {
        expenseChart.data.labels = categories;
        expenseChart.data.datasets[0].data = amounts;
        expenseChart.update();
    } else {
        const ctx = document.getElementById('expenseChart').getContext('2d');
        expenseChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: categories,
                datasets: [{
                    data: amounts,
                    backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
}

function updateInsights() {
    const insightDiv = document.getElementById('insight-messages');
    if (!insightDiv) return;
    
    const monthTxs = getCurrentMonthTransactions();
    const expenseByCategory = {};
    monthTxs.filter(t => t.type === 'expense').forEach(t => {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    });

    let insights = [];

    // Budget alerts
    for (let [cat, limit] of Object.entries(budgets)) {
        const spent = expenseByCategory[cat] || 0;
        if (spent === 0) continue;
        const percent = (spent / limit) * 100;
        if (percent >= 90 && percent < 100) {
            insights.push({ type: 'warning', message: `⚠️ You've used ${percent.toFixed(0)}% of your ${cat} budget.` });
        } else if (percent >= 100) {
            insights.push({ type: 'danger', message: `❌ You've exceeded your ${cat} budget by ${formatINR(spent - limit)}!` });
        } else if (percent <= 30 && spent > 0) {
            insights.push({ type: 'success', message: `✅ You're on track with ${cat} – only ${percent.toFixed(0)}% used.` });
        }
    }

    // Spending trend (top category)
    const totalExpense = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    if (totalExpense > 0) {
        const topCategory = Object.entries(expenseByCategory).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);
        const topPercent = (topCategory[1] / totalExpense) * 100;
        if (topPercent > 50) {
            insights.push({ type: 'info', message: `📊 Most of your spending (${topPercent.toFixed(0)}%) is on ${topCategory[0]}.` });
        }
    }

    if (insights.length === 0) {
        insights.push({ type: 'success', message: '✨ You’re doing great! Keep tracking.' });
    }

    insightDiv.innerHTML = insights.map(i => 
        `<div class="insight-item ${i.type === 'danger' ? 'warning' : i.type}">${i.message}</div>`
    ).join('');
}

function renderBillReminders() {
    if (!billList) return;
    const today = new Date();
    const upcoming = [];

    // Get all recurring expense transactions (bills)
    const recurringExpenses = transactions.filter(t => t.type === 'expense' && t.recurring);
    
    // For each, calculate next due date (assuming monthly)
    recurringExpenses.forEach(t => {
        const lastDate = new Date(t.date);
        const nextDue = new Date(lastDate);
        nextDue.setMonth(nextDue.getMonth() + 1); // simple monthly

        // Only show if due date is in the future
        if (nextDue >= today) {
            const daysUntil = Math.ceil((nextDue - today) / (1000 * 60 * 60 * 24));
            upcoming.push({
                name: t.description,
                dueDate: nextDue.toISOString().slice(0,10),
                amount: t.amount,
                daysUntil,
                category: t.category
            });
        }
    });

    // Sort by due date (soonest first)
    upcoming.sort((a, b) => a.daysUntil - b.daysUntil);

    if (upcoming.length === 0) {
        billList.innerHTML = '<li class="bill-item" style="justify-content: center;">No upcoming bills</li>';
        return;
    }

    billList.innerHTML = upcoming.map(bill => {
        const dueClass = bill.daysUntil <= 7 ? 'due-soon' : '';
        return `
            <li class="bill-item ${dueClass}">
                <div class="bill-info">
                    <span class="bill-name">${bill.name}</span>
                    <span class="bill-date">Due: ${bill.dueDate}</span>
                </div>
                <span class="bill-amount">${formatINR(bill.amount)}</span>
                ${bill.daysUntil <= 7 ? `<span class="bill-due-soon">Due in ${bill.daysUntil} day${bill.daysUntil === 1 ? '' : 's'}</span>` : ''}
            </li>
        `;
    }).join('');
}

// Master UI update
function updateUI() {
    updateSummary();
    renderTransactions();
    renderBudgets();
    updateChart();
    updateInsights();
    renderBillReminders();
    saveTransactionsToStorage();
}

// ============================ CRUD Operations ============================

// Add transaction
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const newTransaction = {
        id: Date.now(),
        description: descInput.value,
        amount: parseFloat(amountInput.value),
        type: typeSelect.value,
        category: categorySelect.value,
        date: new Date().toISOString().slice(0,10),
        recurring: recurringCheckbox.checked
    };

    transactions.push(newTransaction);
    updateUI();

    // Reset form
    descInput.value = '';
    amountInput.value = '';
    typeSelect.value = 'income';
    categorySelect.value = 'Food';
    recurringCheckbox.checked = false;
});

// Delete transaction
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    updateUI();
}

// ============================ Export / Import ============================

function exportToCSV() {
    if (transactions.length === 0) {
        alert('No transactions to export.');
        return;
    }

    const headers = ['ID', 'Description', 'Amount', 'Type', 'Category', 'Date', 'Recurring'];
    const rows = transactions.map(t => [t.id, t.description, t.amount, t.type, t.category, t.date, t.recurring]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'budget_transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
}

exportBtn.addEventListener('click', exportToCSV);

importBtn.addEventListener('click', () => importFile.click());

importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const csv = event.target.result;
        const lines = csv.split('\n');
        const headers = lines[0].split(',');
        // Assume format: ID,Description,Amount,Type,Category,Date,Recurring
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = lines[i].split(',');
            const transaction = {
                id: Number(values[0]),
                description: values[1],
                amount: parseFloat(values[2]),
                type: values[3],
                category: values[4],
                date: values[5],
                recurring: values[6] === 'true'
            };
            // Avoid duplicates by checking id
            if (!transactions.some(t => t.id === transaction.id)) {
                transactions.push(transaction);
            }
        }
        updateUI();
        alert('Import complete!');
    };
    reader.readAsText(file);
    importFile.value = ''; // reset
});

// ============================ Voice Input ============================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
    voiceBtn.disabled = true;
    voiceBtn.textContent = 'Voice not supported';
} else {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    voiceBtn.addEventListener('click', () => {
        voiceBtn.classList.add('listening');
        voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i> Listening...';
        recognition.start();
    });

    recognition.addEventListener('result', (e) => {
        const transcript = e.results[0][0].transcript.toLowerCase();
        console.log('You said:', transcript);
        parseVoiceCommand(transcript);
    });

    recognition.addEventListener('end', () => {
        voiceBtn.classList.remove('listening');
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice Input';
    });

    recognition.addEventListener('error', (e) => {
        alert('Voice error: ' + e.error);
        voiceBtn.classList.remove('listening');
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice Input';
    });
}

/**
 * Enhanced voice command parser.
 * Examples:
 *   "add expense 200 for food dinner" → amount 200, type expense, category Food, description "dinner"
 *   "income 1500 salary" → amount 1500, type income, category Other, description "salary"
 *   "spent 300 on transport bus fare" → amount 300, type expense, category Transport, description "bus fare"
 */
function parseVoiceCommand(text) {
    // Defaults
    let type = 'expense';
    let amount = 0;
    let category = 'Other';
    let description = '';

    // Determine transaction type (income or expense)
    if (text.includes('income') || text.includes('salary') || text.includes('earned')) {
        type = 'income';
    }

    // Extract the first number as amount
    const amountMatch = text.match(/\d+(\.\d+)?/);
    if (!amountMatch) {
        alert('Could not detect amount. Please try again.');
        return;
    }
    amount = parseFloat(amountMatch[0]);

    // Get the part of the text after the amount
    const amountIndex = text.indexOf(amountMatch[0]);
    let afterAmount = text.substring(amountIndex + amountMatch[0].length).trim();

    // Try to find a known category after "for" or "in" or "on"
    // Build a regex that matches any of the budget category names
    const categoryNames = Object.keys(budgets).map(cat => cat.toLowerCase());
    const categoryPattern = new RegExp(`(?:for|in|on)\\s+(${categoryNames.join('|')})`, 'i');
    const categoryMatch = afterAmount.match(categoryPattern);

    if (categoryMatch) {
        // Extract the matched category word (e.g., "food")
        const matchedCat = categoryMatch[1];
        // Find the proper capitalisation from budgets keys
        const exactCategory = Object.keys(budgets).find(
            cat => cat.toLowerCase() === matchedCat.toLowerCase()
        );
        if (exactCategory) {
            category = exactCategory;
        }
        // Remove the entire "for/in/on <category>" phrase from afterAmount to get description
        description = afterAmount.replace(categoryMatch[0], '').trim();
    } else {
        // No category phrase – the whole afterAmount becomes the description
        description = afterAmount;
    }

    // If description is empty after processing, provide a fallback
    if (!description) {
        description = 'Voice entry';
    }

    // Fill the form
    descInput.value = description;
    amountInput.value = amount;
    typeSelect.value = type;
    // Set category if it exists in dropdown
    if (category !== 'Other' && [...categorySelect.options].some(opt => opt.value === category)) {
        categorySelect.value = category;
    } else {
        categorySelect.value = 'Other';
    }
}

// ============================ Dark Mode Toggle ============================
const body = document.body;

// Load saved theme
if (localStorage.getItem('theme') === 'dark') {
    body.classList.add('dark-mode');
    themeToggle.textContent = '☀️ Light Mode';
} else {
    themeToggle.textContent = '🌙 Dark Mode';
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
    themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// ============================ Budget Editing ============================

// Populate the edit form with current budget values
function populateBudgetEditForm() {
    let html = '';
    for (let [cat, limit] of Object.entries(budgets)) {
        html += `
            <div>
                <label for="budget-${cat}">${cat}</label>
                <input type="number" id="budget-${cat}" value="${limit}" step="0.01" min="0">
            </div>
        `;
    }
    budgetInputs.innerHTML = html;
}

editBudgetsBtn.addEventListener('click', () => {
    populateBudgetEditForm();
    budgetEditForm.style.display = 'block';
});

cancelBudgetsBtn.addEventListener('click', () => {
    budgetEditForm.style.display = 'none';
});

saveBudgetsBtn.addEventListener('click', () => {
    // Read new values from inputs
    for (let cat of Object.keys(budgets)) {
        const input = document.getElementById(`budget-${cat}`);
        if (input) {
            const newLimit = parseFloat(input.value);
            if (!isNaN(newLimit) && newLimit >= 0) {
                budgets[cat] = newLimit;
            }
        }
    }
    saveBudgetsToStorage();
    budgetEditForm.style.display = 'none';
    renderBudgets();      // Refresh progress bars
    updateInsights();     // Insights may change based on new budgets
});

// ============================ Initialization ============================
loadTransactionsFromStorage();
loadBudgetsFromStorage();
checkAndAddRecurring();
updateUI();