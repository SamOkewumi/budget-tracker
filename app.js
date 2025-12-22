// Global state
let expenses = [];
let currentMonth = new Date();
let currentFilter = 'all';

// Category configuration
const categories = {
    housing: { name: 'Housing', emoji: '🏠', color: '#3B82F6' },
    utilities: { name: 'Utilities', emoji: '⚡', color: '#EAB308' },
    groceries: { name: 'Groceries', emoji: '🛒', color: '#10B981' },
    dining: { name: 'Eating Out', emoji: '🍔', color: '#EC4899' },
    transportation: { name: 'Transportation', emoji: '🚗', color: '#F97316' },
    subscriptions: { name: 'Subscriptions', emoji: '📺', color: '#8B5CF6' },
    healthcare: { name: 'Healthcare', emoji: '🏥', color: '#14B8A6' },
    shopping: { name: 'Shopping', emoji: '🛍️', color: '#A855F7' },
    entertainment: { name: 'Entertainment', emoji: '🎬', color: '#F43F5E' },
    other: { name: 'Other', emoji: '📦', color: '#64748B' }
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadExpenses();
    renderCategoryFilters();
    renderExpenses();
    updateSummary();
    updateMonthDisplay();
    
    // Show/hide frequency field based on recurring checkbox
    document.getElementById('expense-recurring').addEventListener('change', (e) => {
        const frequencyField = document.getElementById('frequency-field');
        frequencyField.classList.toggle('hidden', !e.target.checked);
    });
});

// Modal functions - SIMPLIFIED
function openExpenseModal() {
    document.getElementById('expense-form').reset();
    document.getElementById('expense-id').value = '';
    document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('modal-title').textContent = 'Add Expense';
    document.getElementById('frequency-field').classList.add('hidden');
    document.getElementById('expense-modal').classList.remove('hidden');
}

function closeExpenseModal() {
    document.getElementById('expense-modal').classList.add('hidden');
}

function openSettings() {
    document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettings() {
    document.getElementById('settings-modal').classList.add('hidden');
}


function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('hidden');
    
    // Trigger animation
    requestAnimationFrame(() => {
        modal.querySelector('div > div').style.transform = 'translateY(0)';
        modal.querySelector('div > div').style.opacity = '1';
    });
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    const content = modal.querySelector('div > div');
    
    content.style.transform = 'translateY(100%)';
    content.style.opacity = '0';
    
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

// Handle expense form submission
function handleExpenseSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const id = formData.get('id');
    
    const expense = {
        id: id || Date.now().toString() + Math.random().toString(36).slice(2),
        date: formData.get('date'),
        description: formData.get('description'),
        amount: parseFloat(formData.get('amount')),
        category: formData.get('category'),
        recurring: formData.get('recurring') === 'on',
        frequency: formData.get('frequency') || 'monthly',
        notes: formData.get('notes') || ''
    };
    
    if (id) {
        // Update existing
        const index = expenses.findIndex(e => e.id === id);
        if (index !== -1) {
            expenses[index] = expense;
        }
    } else {
        // Add new
        expenses.push(expense);
    }
    
    saveExpenses();
    renderExpenses();
    updateSummary();
    closeExpenseModal();
}

// Edit expense
function editExpense(id) {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;
    
    document.getElementById('expense-id').value = expense.id;
    document.getElementById('expense-date').value = expense.date;
    document.getElementById('expense-description').value = expense.description;
    document.getElementById('expense-amount').value = expense.amount;
    document.getElementById('expense-category').value = expense.category;
    document.getElementById('expense-recurring').checked = expense.recurring;
    document.getElementById('expense-frequency').value = expense.frequency || 'monthly';
    document.getElementById('expense-notes').value = expense.notes || '';
    document.getElementById('modal-title').textContent = 'Edit Expense';
    
    const frequencyField = document.getElementById('frequency-field');
    frequencyField.classList.toggle('hidden', !expense.recurring);
    
    showModal('expense-modal');
}

// Delete expense
function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    expenses = expenses.filter(e => e.id !== id);
    saveExpenses();
    renderExpenses();
    updateSummary();
}

// Render expenses list
function renderExpenses() {
    const container = document.getElementById('expenses-list');
    const filtered = getFilteredExpenses();
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-slate-400">
                <div class="text-6xl mb-4">📊</div>
                <p>No expenses found</p>
                <p class="text-sm mt-2">${currentFilter === 'all' ? 'Add your first expense' : 'Try a different filter'}</p>
            </div>
        `;
        return;
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let html = '<div class="space-y-3">';
    
    filtered.forEach(expense => {
        const cat = categories[expense.category];
        html += `
            <div class="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors">
                <div class="flex items-center gap-4 flex-1 min-w-0">
                    <div class="text-3xl">${cat.emoji}</div>
                    <div class="flex-1 min-w-0">
                        <div class="font-semibold text-slate-900 truncate">${expense.description}</div>
                        <div class="text-sm text-slate-500">
                            ${formatDate(expense.date)} • ${cat.name}
                            ${expense.recurring ? ' • 🔄 Recurring' : ''}
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <div class="text-xl font-bold text-slate-900">$${expense.amount.toFixed(2)}</div>
                    <div class="flex gap-1">
                        <button onclick="editExpense('${expense.id}')" 
                                class="p-2 text-slate-400 hover:text-indigo-600"
                                title="Edit">
                            ✏️
                        </button>
                        <button onclick="deleteExpense('${expense.id}')" 
                                class="p-2 text-slate-400 hover:text-red-600"
                                title="Delete">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Get filtered expenses for current month and category
function getFilteredExpenses() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    return expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        const matchesMonth = expenseDate.getFullYear() === year && expenseDate.getMonth() === month;
        const matchesCategory = currentFilter === 'all' || expense.category === currentFilter;
        return matchesMonth && matchesCategory;
    });
}

// Render category filter buttons
function renderCategoryFilters() {
    const container = document.getElementById('category-filters');
    let html = `
        <button onclick="filterByCategory('all')" 
                class="px-4 py-2 rounded-lg ${currentFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'} whitespace-nowrap">
            All
        </button>
    `;
    
    Object.keys(categories).forEach(key => {
        const cat = categories[key];
        html += `
            <button onclick="filterByCategory('${key}')" 
                    class="px-4 py-2 rounded-lg ${currentFilter === key ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'} whitespace-nowrap">
                ${cat.emoji} ${cat.name}
            </button>
        `;
    });
    
    container.innerHTML = html;
}

// Filter by category
function filterByCategory(category) {
    currentFilter = category;
    renderCategoryFilters();
    renderExpenses();
}

// Update summary cards
function updateSummary() {
    const filtered = getFilteredExpenses();
    
    // Total spent this month
    const total = filtered.reduce((sum, e) => sum + e.amount, 0);
    document.getElementById('total-spent').textContent = `$${total.toFixed(2)}`;
    document.getElementById('transaction-count').textContent = `${filtered.length} transaction${filtered.length !== 1 ? 's' : ''}`;
    
    // Recurring expenses
    const recurring = filtered.filter(e => e.recurring);
    const recurringTotal = recurring.reduce((sum, e) => sum + e.amount, 0);
    document.getElementById('recurring-total').textContent = `$${recurringTotal.toFixed(2)}`;
    document.getElementById('recurring-count').textContent = `${recurring.length} subscription${recurring.length !== 1 ? 's' : ''}`;
    
    // Top category
    const categoryTotals = {};
    filtered.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    
    const topCategoryKey = Object.keys(categoryTotals).reduce((a, b) => 
        categoryTotals[a] > categoryTotals[b] ? a : b, 
        Object.keys(categoryTotals)[0]
    );
    
    if (topCategoryKey) {
        const topCat = categories[topCategoryKey];
        document.getElementById('top-category').textContent = `${topCat.emoji} ${topCat.name}`;
        document.getElementById('top-category-amount').textContent = `$${categoryTotals[topCategoryKey].toFixed(2)}`;
    } else {
        document.getElementById('top-category').textContent = '-';
        document.getElementById('top-category-amount').textContent = '$0.00';
    }
}

// Month navigation
function previousMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    updateMonthDisplay();
    renderExpenses();
    updateSummary();
}

function nextMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    updateMonthDisplay();
    renderExpenses();
    updateSummary();
}

function updateMonthDisplay() {
    const options = { year: 'numeric', month: 'long' };
    document.getElementById('current-month').textContent = currentMonth.toLocaleDateString('en-US', options);
}

// Helper: Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Export data 
function exportData(format) {
    if (format === 'json') {
        const data = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            expenses: expenses
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        downloadFile(blob, `budget-tracker-${Date.now()}.json`);
    } else if (format === 'csv') {
        let csv = 'Date,Description,Amount,Category,Recurring,Frequency,Notes\n';
        
        expenses.forEach(expense => {
            // Escape quotes in description and notes
            const description = (expense.description || '').replace(/"/g, '""');
            const notes = (expense.notes || '').replace(/"/g, '""');
            
            csv += `${expense.date},"${description}",${expense.amount},${expense.category},${expense.recurring},${expense.frequency || ''},"${notes}"\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        downloadFile(blob, `budget-tracker-${Date.now()}.csv`);
    }
}


// Import data
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            if (!data.expenses || !Array.isArray(data.expenses)) {
                throw new Error('Invalid file format');
            }
            
            if (confirm(`Import ${data.expenses.length} expenses? This will replace your current data.`)) {
                expenses = data.expenses;
                saveExpenses();
                renderExpenses();
                updateSummary();
                closeSettings();
                alert('Import successful!');
            }
        } catch (err) {
            alert('Failed to import: ' + err.message);
        }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset input
}

// Clear all data
function clearAllData() {
    if (!confirm('Are you sure? This will delete ALL your expenses permanently.')) return;
    if (!confirm('This cannot be undone. Are you absolutely sure?')) return;
    
    expenses = [];
    saveExpenses();
    renderExpenses();
    updateSummary();
    closeSettings();
}

// Helper: Download file
function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Close modal when clicking outside
document.getElementById('expense-modal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeExpenseModal();
    }
});

document.getElementById('settings-modal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeSettings();
    }
});

// Load demo data
function loadDemoData() {
    if (expenses.length > 0) {
        if (!confirm('This will replace your current data. Continue?')) {
            return;
        }
    }
    
    expenses = [
        // AUGUST 2025
        { id: '1', date: '2025-08-01', description: 'Rent Payment', amount: 1500.00, category: 'housing', recurring: true, frequency: 'monthly', notes: 'Monthly rent' },
        { id: '2', date: '2025-08-03', description: 'REXALL PHARMACY #8139 TORONTO ON', amount: 6.09, category: 'healthcare', recurring: false, frequency: 'monthly', notes: '' },
        { id: '3', date: '2025-08-05', description: 'DOLLARAMA # 741 TORONTO ON', amount: 24.58, category: 'shopping', recurring: false, frequency: 'monthly', notes: '' },
        { id: '4', date: '2025-08-06', description: 'PRESTO FARE Toronto ON', amount: 3.30, category: 'transportation', recurring: false, frequency: 'monthly', notes: 'TTC fare' },
        { id: '5', date: '2025-08-08', description: 'Netflix', amount: 17.99, category: 'subscriptions', recurring: true, frequency: 'monthly', notes: '' },
        { id: '6', date: '2025-08-10', description: 'Walmart Supercentre', amount: 156.23, category: 'groceries', recurring: false, frequency: 'monthly', notes: 'Weekly groceries' },
        { id: '7', date: '2025-08-12', description: 'Shell Gas Station', amount: 52.34, category: 'transportation', recurring: false, frequency: 'monthly', notes: 'Gas fill-up' },
        { id: '8', date: '2025-08-15', description: 'Hydro Bill', amount: 87.23, category: 'utilities', recurring: true, frequency: 'monthly', notes: 'Electricity' },
        { id: '9', date: '2025-08-17', description: 'Tim Hortons', amount: 8.45, category: 'dining', recurring: false, frequency: 'monthly', notes: 'Coffee and breakfast' },
        { id: '10', date: '2025-08-19', description: 'Amazon.ca', amount: 67.89, category: 'shopping', recurring: false, frequency: 'monthly', notes: 'Household items' },
        { id: '11', date: '2025-08-22', description: 'Metro Groceries', amount: 89.12, category: 'groceries', recurring: false, frequency: 'monthly', notes: '' },
        { id: '12', date: '2025-08-25', description: 'Rogers Wireless', amount: 75.00, category: 'utilities', recurring: true, frequency: 'monthly', notes: 'Phone bill' },
        { id: '13', date: '2025-08-28', description: 'Cineplex Theatre', amount: 32.50, category: 'entertainment', recurring: false, frequency: 'monthly', notes: 'Movie tickets' },
        
        // SEPTEMBER 2025
        { id: '14', date: '2025-09-01', description: 'Rent Payment', amount: 1500.00, category: 'housing', recurring: true, frequency: 'monthly', notes: 'Monthly rent' },
        { id: '15', date: '2025-09-02', description: 'Loblaws', amount: 124.56, category: 'groceries', recurring: false, frequency: 'monthly', notes: '' },
        { id: '16', date: '2025-09-05', description: 'Uber Ride', amount: 18.75, category: 'transportation', recurring: false, frequency: 'monthly', notes: 'Downtown trip' },
        { id: '17', date: '2025-09-08', description: 'Netflix', amount: 17.99, category: 'subscriptions', recurring: true, frequency: 'monthly', notes: '' },
        { id: '18', date: '2025-09-10', description: 'Shoppers Drug Mart', amount: 43.21, category: 'healthcare', recurring: false, frequency: 'monthly', notes: 'Prescriptions' },
        { id: '19', date: '2025-09-12', description: 'Boston Pizza', amount: 54.32, category: 'dining', recurring: false, frequency: 'monthly', notes: 'Dinner out' },
        { id: '20', date: '2025-09-15', description: 'Hydro Bill', amount: 92.15, category: 'utilities', recurring: true, frequency: 'monthly', notes: 'Electricity' },
        { id: '21', date: '2025-09-17', description: 'Costco', amount: 187.45, category: 'groceries', recurring: false, frequency: 'monthly', notes: 'Bulk shopping' },
        { id: '22', date: '2025-09-20', description: 'Esso Gas', amount: 58.90, category: 'transportation', recurring: false, frequency: 'monthly', notes: '' },
        { id: '23', date: '2025-09-22', description: 'Spotify Premium', amount: 11.99, category: 'subscriptions', recurring: true, frequency: 'monthly', notes: '' },
        { id: '24', date: '2025-09-25', description: 'Rogers Wireless', amount: 75.00, category: 'utilities', recurring: true, frequency: 'monthly', notes: 'Phone bill' },
        { id: '25', date: '2025-09-28', description: 'Winners', amount: 76.43, category: 'shopping', recurring: false, frequency: 'monthly', notes: 'Clothing' },
        
        // OCTOBER 2025
        { id: '26', date: '2025-10-01', description: 'Rent Payment', amount: 1500.00, category: 'housing', recurring: true, frequency: 'monthly', notes: 'Monthly rent' },
        { id: '27', date: '2025-10-03', description: 'Walmart', amount: 145.67, category: 'groceries', recurring: false, frequency: 'monthly', notes: '' },
        { id: '28', date: '2025-10-05', description: 'McDonald\'s', amount: 12.34, category: 'dining', recurring: false, frequency: 'monthly', notes: 'Quick lunch' },
        { id: '29', date: '2025-10-08', description: 'Netflix', amount: 17.99, category: 'subscriptions', recurring: true, frequency: 'monthly', notes: '' },
        { id: '30', date: '2025-10-10', description: 'Petro-Canada', amount: 61.25, category: 'transportation', recurring: false, frequency: 'monthly', notes: 'Gas' },
        { id: '31', date: '2025-10-12', description: 'Canadian Tire', amount: 89.99, category: 'shopping', recurring: false, frequency: 'monthly', notes: 'Tools' },
        { id: '32', date: '2025-10-15', description: 'Hydro Bill', amount: 78.56, category: 'utilities', recurring: true, frequency: 'monthly', notes: 'Electricity' },
        { id: '33', date: '2025-10-17', description: 'Starbucks', amount: 6.85, category: 'dining', recurring: false, frequency: 'monthly', notes: 'Coffee' },
        { id: '34', date: '2025-10-19', description: 'FreshCo', amount: 98.34, category: 'groceries', recurring: false, frequency: 'monthly', notes: '' },
        { id: '35', date: '2025-10-22', description: 'Spotify Premium', amount: 11.99, category: 'subscriptions', recurring: true, frequency: 'monthly', notes: '' },
        { id: '36', date: '2025-10-25', description: 'Rogers Wireless', amount: 75.00, category: 'utilities', recurring: true, frequency: 'monthly', notes: 'Phone bill' },
        { id: '37', date: '2025-10-28', description: 'LCBO', amount: 42.50, category: 'shopping', recurring: false, frequency: 'monthly', notes: '' },
        { id: '38', date: '2025-10-30', description: 'Halloween Costumes', amount: 58.90, category: 'entertainment', recurring: false, frequency: 'monthly', notes: '' },
        
        // NOVEMBER 2025
        { id: '39', date: '2025-11-01', description: 'Rent Payment', amount: 1500.00, category: 'housing', recurring: true, frequency: 'monthly', notes: 'Monthly rent' },
        { id: '40', date: '2025-11-03', description: 'No Frills', amount: 112.45, category: 'groceries', recurring: false, frequency: 'monthly', notes: '' },
        { id: '41', date: '2025-11-05', description: 'Subway', amount: 14.67, category: 'dining', recurring: false, frequency: 'monthly', notes: 'Lunch' },
        { id: '42', date: '2025-11-08', description: 'Netflix', amount: 17.99, category: 'subscriptions', recurring: true, frequency: 'monthly', notes: '' },
        { id: '43', date: '2025-11-10', description: 'Shell Gas', amount: 55.78, category: 'transportation', recurring: false, frequency: 'monthly', notes: '' },
        { id: '44', date: '2025-11-12', description: 'Best Buy', amount: 234.99, category: 'shopping', recurring: false, frequency: 'monthly', notes: 'Electronics' },
        { id: '45', date: '2025-11-15', description: 'Hydro Bill', amount: 94.32, category: 'utilities', recurring: true, frequency: 'monthly', notes: 'Electricity' },
        { id: '46', date: '2025-11-17', description: 'The Keg', amount: 87.50, category: 'dining', recurring: false, frequency: 'monthly', notes: 'Anniversary dinner' },
        { id: '47', date: '2025-11-19', description: 'Sobeys', amount: 134.21, category: 'groceries', recurring: false, frequency: 'monthly', notes: '' },
        { id: '48', date: '2025-11-22', description: 'Spotify Premium', amount: 11.99, category: 'subscriptions', recurring: true, frequency: 'monthly', notes: '' },
        { id: '49', date: '2025-11-25', description: 'Rogers Wireless', amount: 75.00, category: 'utilities', recurring: true, frequency: 'monthly', notes: 'Phone bill' },
        { id: '50', date: '2025-11-27', description: 'Black Friday - Amazon', amount: 156.78, category: 'shopping', recurring: false, frequency: 'monthly', notes: 'Black Friday deals' },
        
        // DECEMBER 2025
        { id: '51', date: '2025-12-01', description: 'Rent Payment', amount: 1500.00, category: 'housing', recurring: true, frequency: 'monthly', notes: 'Monthly rent' },
        { id: '52', date: '2025-12-03', description: 'Walmart Groceries', amount: 167.89, category: 'groceries', recurring: false, frequency: 'monthly', notes: 'Holiday food' },
        { id: '53', date: '2025-12-05', description: 'Petro-Canada', amount: 63.45, category: 'transportation', recurring: false, frequency: 'monthly', notes: '' },
        { id: '54', date: '2025-12-08', description: 'Netflix', amount: 17.99, category: 'subscriptions', recurring: true, frequency: 'monthly', notes: '' },
        { id: '55', date: '2025-12-10', description: 'Tim Hortons', amount: 9.87, category: 'dining', recurring: false, frequency: 'monthly', notes: '' },
        { id: '56', date: '2025-12-11', description: 'Spotify Premium', amount: 11.99, category: 'subscriptions', recurring: true, frequency: 'monthly', notes: '' },
        { id: '57', date: '2025-12-12', description: 'Shell Gas Station', amount: 45.00, category: 'transportation', recurring: false, frequency: 'monthly', notes: '' },
        { id: '58', date: '2025-12-14', description: 'Restaurant - Pizza', amount: 32.50, category: 'dining', recurring: false, frequency: 'monthly', notes: 'Date night' },
        { id: '59', date: '2025-12-15', description: 'Hydro Bill', amount: 87.23, category: 'utilities', recurring: true, frequency: 'monthly', notes: 'Electricity' },
        { id: '60', date: '2025-12-17', description: 'Indigo Books', amount: 78.45, category: 'shopping', recurring: false, frequency: 'monthly', notes: 'Christmas gifts' },
        { id: '61', date: '2025-12-18', description: 'Costco', amount: 245.67, category: 'groceries', recurring: false, frequency: 'monthly', notes: 'Holiday shopping' },
        { id: '62', date: '2025-12-20', description: 'Uber Eats', amount: 42.30, category: 'dining', recurring: false, frequency: 'monthly', notes: 'Delivery' },
        { id: '63', date: '2025-12-22', description: 'Rogers Wireless', amount: 75.00, category: 'utilities', recurring: true, frequency: 'monthly', notes: 'Phone bill' }
    ];
    
    saveExpenses();
    renderExpenses();
    updateSummary();
    closeSettings();
    
    alert('✅ Demo data loaded! 63 transactions from August-December 2025');
}

