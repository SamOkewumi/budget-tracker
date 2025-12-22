// LocalStorage keys
const STORAGE_KEY = 'budget_tracker_expenses';

// Load expenses from localStorage
function loadExpenses() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            expenses = JSON.parse(stored);
            console.log(`✅ Loaded ${expenses.length} expenses from storage`);
        }
    } catch (err) {
        console.error('❌ Failed to load expenses:', err);
        expenses = [];
    }
}

// Save expenses to localStorage
function saveExpenses() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
        console.log(`✅ Saved ${expenses.length} expenses to storage`);
    } catch (err) {
        console.error('❌ Failed to save expenses:', err);
        alert('Failed to save data. Storage might be full.');
    }
}

// Get storage usage info
function getStorageInfo() {
    const data = localStorage.getItem(STORAGE_KEY) || '';
    const sizeKB = (data.length / 1024).toFixed(2);
    return {
        itemCount: expenses.length,
        sizeKB: sizeKB,
        sizeMB: (sizeKB / 1024).toFixed(2)
    };
}
