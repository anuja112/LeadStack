// Available tags for categorization
const AVAILABLE_TAGS = ['None', 'Jobs', 'Clients', 'Research', 'Learning', 'Important'];

// Data structure for leads (migrated from simple string array)
let myLeads = [];
let currentFilter = 'all';
let searchQuery = '';

// DOM Elements
const inputEl = document.getElementById("input-el");
const inputBtn = document.getElementById("input-btn");
const ulEl = document.getElementById("ul-el");
const deleteBtn = document.getElementById("delete-btn");
const tabBtn = document.getElementById("tab-btn");
const searchEl = document.getElementById("search-el");
const emptyState = document.getElementById("empty-state");
const statsText = document.getElementById("stats-text");
const themeToggle = document.getElementById("theme-toggle");
const exportBtn = document.getElementById("export-btn");
const importBtn = document.getElementById("import-btn");
const openAllBtn = document.getElementById("open-all-btn");
const fileInput = document.getElementById("file-input");

// Filter tabs
const filterTabs = document.querySelectorAll('.filter-tab');

// Load saved theme preference
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

// Load leads from localStorage and migrate old format if needed
function loadLeads() {
    const leadsFromStorage = localStorage.getItem("myLeads");

    if (leadsFromStorage) {
        const parsed = JSON.parse(leadsFromStorage);

        // Check if old format (array of strings) or new format (array of objects)
        if (parsed.length > 0 && typeof parsed[0] === 'string') {
            // Migrate from old format to new format
            myLeads = parsed.map(url => ({
                url: url,
                favorite: false,
                tag: 'None',
                createdAt: Date.now()
            }));
            saveLeads(); // Save migrated data
        } else {
            myLeads = parsed;
        }
    }

    render();
}

// Save leads to localStorage
function saveLeads() {
    localStorage.setItem("myLeads", JSON.stringify(myLeads));
}

// Initialize on load
loadLeads();


themeToggle.addEventListener("click", function() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});


inputBtn.addEventListener("click", function() {
    const url = inputEl.value.trim();

    if (!url) {
        showToast("Please enter a URL");
        return;
    }

    // Check for duplicates
    if (myLeads.some(lead => lead.url === url)) {
        showToast("Already saved");
        inputEl.value = "";
        return;
    }

    myLeads.push({
        url: url,
        favorite: false,
        tag: 'None',
        createdAt: Date.now()
    });

    inputEl.value = "";
    saveLeads();
    render();
    showToast("Lead saved ✓");
});

// Allow Enter key to save input
inputEl.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        inputBtn.click();
    }
});


tabBtn.addEventListener("click", function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const url = tabs[0].url;

        // Check for duplicates
        if (myLeads.some(lead => lead.url === url)) {
            showToast("Already saved");
            return;
        }

        myLeads.push({
            url: url,
            favorite: false,
            tag: 'None',
            createdAt: Date.now()
        });

        saveLeads();
        render();
        showToast("Tab saved ✓");
    });
});


deleteBtn.addEventListener("dblclick", function() {
    if (myLeads.length === 0) {
        showToast("No leads to delete");
        return;
    }

    myLeads = [];
    saveLeads();
    render();
    showToast("All leads deleted");
});


searchEl.addEventListener("input", function() {
    searchQuery = searchEl.value.toLowerCase();
    render();
});


filterTabs.forEach(tab => {
    tab.addEventListener('click', function() {
        // Update active state
        filterTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');

        // Update filter
        currentFilter = this.getAttribute('data-filter');
        render();
    });
});


function render() {
    // Filter leads based on current filter and search
    let filteredLeads = myLeads;

    // Apply favorite filter
    if (currentFilter === 'favorites') {
        filteredLeads = filteredLeads.filter(lead => lead.favorite);
    }

    // Apply search filter
    if (searchQuery) {
        filteredLeads = filteredLeads.filter(lead =>
            lead.url.toLowerCase().includes(searchQuery)
        );
    }

    // Update stats
    updateStats();

    // Show/hide empty state
    if (filteredLeads.length === 0) {
        emptyState.style.display = 'flex';
        ulEl.style.display = 'none';
        return;
    } else {
        emptyState.style.display = 'none';
        ulEl.style.display = 'flex';
    }

    // Render leads
    let listItems = "";

    for (let i = 0; i < filteredLeads.length; i++) {
        const lead = filteredLeads[i];
        const originalIndex = myLeads.indexOf(lead);
        const starIcon = lead.favorite
            ? '<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M10 1L12.9389 7.0129L19.5106 7.90983L14.7553 12.4871L15.8779 19.0902L10 15.9L4.12215 19.0902L5.24472 12.4871L0.489435 7.90983L7.06107 7.0129L10 1Z"/></svg>'
            : '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 1L12.9389 7.0129L19.5106 7.90983L14.7553 12.4871L15.8779 19.0902L10 15.9L4.12215 19.0902L5.24472 12.4871L0.489435 7.90983L7.06107 7.0129L10 1Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

        listItems += `
            <li class="lead-item">
                <button class="lead-star ${lead.favorite ? 'starred' : ''}" data-index="${originalIndex}" aria-label="Toggle favorite">
                    ${starIcon}
                </button>
                <div class="lead-main-content">
                    <div class="lead-url-wrapper">
                        <a target='_blank' href='${lead.url}' class="lead-link" title="${lead.url}">
                            ${lead.url}
                        </a>
                    </div>
                    <div class="tag-select-wrapper">
                        <select class="tag-select-inline" data-index="${originalIndex}">
                            ${AVAILABLE_TAGS.map(tag =>
                                `<option value="${tag}" ${lead.tag === tag ? 'selected' : ''}>${tag}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                <div class="lead-actions">
                    <button class="lead-action-btn btn-copy" data-url="${lead.url}" aria-label="Copy URL">
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="8" y="8" width="10" height="10" rx="2" stroke="currentColor" stroke-width="2"/>
                            <path d="M4 12H3C2.44772 12 2 11.5523 2 11V3C2 2.44772 2.44772 2 3 2H11C11.5523 2 12 2.44772 12 3V4" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                    <button class="lead-action-btn btn-delete-row" data-index="${originalIndex}" aria-label="Delete lead">
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 5H17M8 5V3H12V5M8 9V15M12 9V15M5 5L6 17H14L15 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </li>
        `;
    }

    ulEl.innerHTML = listItems;

    // Attach event listeners to dynamically created elements
    attachLeadEventListeners();
}



function attachLeadEventListeners() {
    // Star/Favorite toggle
    document.querySelectorAll('.lead-star').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            myLeads[index].favorite = !myLeads[index].favorite;
            saveLeads();
            render();
        });
    });

    // Copy URL
    document.querySelectorAll('.btn-copy').forEach(btn => {
        btn.addEventListener('click', function() {
            const url = this.getAttribute('data-url');
            copyToClipboard(url);
            showToast("Copied ✓");
        });
    });

    // Delete individual lead
    document.querySelectorAll('.btn-delete-row').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            deleteLead(index);
        });
    });

    // Tag selection
    document.querySelectorAll('.tag-select-inline').forEach(select => {
        select.addEventListener('change', function() {
            const index = parseInt(this.getAttribute('data-index'));
            myLeads[index].tag = this.value;
            saveLeads();
            updateStats();
        });
    });
}



function deleteLead(index) {
    const deletedLead = myLeads[index];
    myLeads.splice(index, 1);
    saveLeads();
    render();

    showToastWithUndo("Lead deleted", function() {
        // Undo: restore the lead at the same position
        myLeads.splice(index, 0, deletedLead);
        saveLeads();
        render();
        showToast("Restored ✓");
    });
}



function copyToClipboard(text) {
    // Use the modern Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
    } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}



function updateStats() {
    const totalLeads = myLeads.length;
    const favoriteCount = myLeads.filter(lead => lead.favorite).length;

    let statsHTML = `${totalLeads} Lead${totalLeads !== 1 ? 's' : ''}`;

    if (favoriteCount > 0) {
        statsHTML += ` · ${favoriteCount} Favorite${favoriteCount !== 1 ? 's' : ''}`;
    }

    statsText.textContent = statsHTML;
}



const toastContainer = document.getElementById('toast-container');

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-message">${message}</span>`;

    toastContainer.appendChild(toast);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('toast-fade-out');
        setTimeout(() => {
            if (toast.parentNode) {
                toastContainer.removeChild(toast);
            }
        }, 250);
    }, 3000);
}

function showToastWithUndo(message, undoCallback) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <span class="toast-message">${message}</span>
        <button class="toast-action">Undo</button>
    `;

    toastContainer.appendChild(toast);

    // Undo button handler
    const undoBtn = toast.querySelector('.toast-action');
    undoBtn.addEventListener('click', function() {
        undoCallback();
        toast.classList.add('toast-fade-out');
        setTimeout(() => {
            if (toast.parentNode) {
                toastContainer.removeChild(toast);
            }
        }, 250);
    });

    // Auto-remove after 5 seconds (longer for undo)
    setTimeout(() => {
        toast.classList.add('toast-fade-out');
        setTimeout(() => {
            if (toast.parentNode) {
                toastContainer.removeChild(toast);
            }
        }, 250);
    }, 5000);
}


exportBtn.addEventListener('click', function() {
    if (myLeads.length === 0) {
        showToast("No leads to export");
        return;
    }

    const dataStr = JSON.stringify(myLeads, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads-export-${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);
    showToast("Exported successfully ✓");
});


importBtn.addEventListener('click', function() {
    fileInput.click();
});

fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(event) {
        try {
            const importedData = JSON.parse(event.target.result);

            // Validate imported data
            if (!Array.isArray(importedData)) {
                showToast("Invalid file format");
                return;
            }

            // Filter out duplicates
            let addedCount = 0;
            importedData.forEach(item => {
                const url = typeof item === 'string' ? item : item.url;

                if (!myLeads.some(lead => lead.url === url)) {
                    if (typeof item === 'string') {
                        // Old format
                        myLeads.push({
                            url: item,
                            favorite: false,
                            tag: 'None',
                            createdAt: Date.now()
                        });
                    } else {
                        // New format
                        myLeads.push(item);
                    }
                    addedCount++;
                }
            });

            saveLeads();
            render();

            if (addedCount > 0) {
                showToast(`Imported ${addedCount} lead${addedCount !== 1 ? 's' : ''} ✓`);
            } else {
                showToast("No new leads to import");
            }

        } catch (error) {
            showToast("Error reading file");
        }
    };

    reader.readAsText(file);

    // Reset file input
    fileInput.value = '';
});


openAllBtn.addEventListener('click', function() {
    // Get filtered leads based on current view
    let leadsToOpen = myLeads;

    if (currentFilter === 'favorites') {
        leadsToOpen = myLeads.filter(lead => lead.favorite);
    }

    if (searchQuery) {
        leadsToOpen = leadsToOpen.filter(lead =>
            lead.url.toLowerCase().includes(searchQuery)
        );
    }

    if (leadsToOpen.length === 0) {
        showToast("No leads to open");
        return;
    }

    if (leadsToOpen.length > 10) {
        // Warn if opening many tabs
        const confirmed = confirm(`This will open ${leadsToOpen.length} tabs. Continue?`);
        if (!confirmed) return;
    }

    leadsToOpen.forEach(lead => {
        window.open(lead.url, '_blank');
    });

    showToast(`Opened ${leadsToOpen.length} lead${leadsToOpen.length !== 1 ? 's' : ''}`);
});
