// ===================================
// DASHBOARD SCRIPT
// All data comes from SERVER_DATA injected by the EJS template
// ===================================

const { uid, event, isAdmin, registrations, allEvents, totalCount } = SERVER_DATA;

let currentData = [...registrations];

// Elements
const tableBody = document.getElementById('tableBody');
const logoutBtn = document.getElementById('logoutBtn');
const totalCountEl = document.getElementById('totalCount');
const eventCountEl = document.getElementById('eventCount');
const teamCountEl = document.getElementById('teamCount');
const eventFilter = document.getElementById('eventFilter');   // admin only
const searchInput = document.getElementById('searchInput');   // admin only


// ---- LOGOUT ----
logoutBtn.addEventListener('click', () => {
    // Clear the token cookie
    document.cookie = 'token=; path=/; max-age=0; SameSite=Strict';
    window.location.href = '/login';
});


// ---- STATS (animated counters) ----
const uniqueEvents = [...new Set(registrations.map(r => r.eventName))].length;
const teamsCount  = registrations.filter(r => r.teamName).length;

animateCount(totalCountEl, totalCount);
animateCount(eventCountEl, isAdmin ? uniqueEvents : totalCount);
animateCount(teamCountEl,  teamsCount);


// ---- FILTERS (admin only) ----
if (eventFilter) {
    eventFilter.addEventListener('change', applyFilters);
}
if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
}

function applyFilters() {
    const selectedEvent = eventFilter ? eventFilter.value : 'all';
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let filtered = [...registrations];

    if (selectedEvent !== 'all') {
        filtered = filtered.filter(r => r.eventName === selectedEvent);
    }

    if (searchTerm) {
        filtered = filtered.filter(r => {
            const haystack = [
                r.eventName,
                r.teamName,
                r.collegeName,
                r.email,
                ...(r.members || [])
            ].join(' ').toLowerCase();
            return haystack.includes(searchTerm);
        });
    }

    currentData = filtered;
    renderTable(filtered);

    // Update total count stat live
    totalCountEl.textContent = filtered.length;
}


// ---- RENDER TABLE ----
function renderTable(data) {
    tableBody.innerHTML = '';

    if (!data.length) {
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="8">NO REGISTRATIONS FOUND</td>
            </tr>`;
        return;
    }

    data.forEach((reg, index) => {
        const memberList = Array.isArray(reg.members)
            ? reg.members.join(', ')
            : (reg.members || '—');

        const statusClass = reg.attendance === 'present' ? 'status-present' : (reg.attendance === 'absent' ? 'status-absent' : '');
        const statusText = reg.attendance === 'present' ? 'Present' : (reg.attendance === 'absent' ? 'Absent' : 'Mark Status');

        // Escape quotes to safely pass to inline onclick
        const safeName = escHtml(reg.teamName || reg.members?.[0] || 'Participant').replace(/'/g, "\\'");
        const safeEvent = escHtml(reg.eventName || '—').replace(/'/g, "\\'");

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="td-number">${index + 1}</td>
            <td class="td-event">${escHtml(reg.eventName || '—')}</td>
            <td class="td-members">
                ${reg.teamName ? `<span class="team-name">${escHtml(reg.teamName)}</span>` : ''}
                <span class="member-list">${escHtml(memberList)}</span>
            </td>
            <td>${escHtml(reg.collegeName || '—')}</td>
            <td>${escHtml(reg.email || '—')}</td>
            <td>${escHtml(reg.phoneNo || '—')}</td>
            <td class="td-utr">${escHtml(reg.utrNo || '—')}</td>
            <td><button class="btn-mark-status ${statusClass}" onclick="openStatusModal('${reg._id}', '${safeName}', '${safeEvent}')">${statusText}</button></td>
        `;
        tableBody.appendChild(row);
    });
}


// ---- STATUS MODAL LOGIC ----
const statusModal = document.getElementById('statusModal');
const statusModalName = document.getElementById('statusModalName');
const statusModalEvent = document.getElementById('statusModalEvent');
const statusModalClose = document.getElementById('statusModalClose');
const markPresentBtn = document.getElementById('markPresentBtn');
const markAbsentBtn = document.getElementById('markAbsentBtn');

let currentStatusId = null;

window.openStatusModal = function(id, name, eventName) {
    currentStatusId = id;
    statusModalName.textContent = name;
    statusModalEvent.textContent = eventName;
    statusModal.style.display = 'flex';
};

function closeStatusModal() {
    if(statusModal) statusModal.style.display = 'none';
    currentStatusId = null;
}

if(statusModalClose) statusModalClose.addEventListener('click', closeStatusModal);

async function updateStatus(status) {
    if (!currentStatusId) return;

    try {
        const response = await fetch(`/dashboard/status/${currentStatusId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        const result = await response.json();
        
        if (response.ok) {
            // Update local data
            const globalIndex = registrations.findIndex(r => r._id === currentStatusId);
            if (globalIndex !== -1) {
                registrations[globalIndex].attendance = status;
            }
            
            // Re-render current filter state
            applyFilters();
            closeStatusModal();
        } else {
            alert(`Error: ${result.message || 'Failed to update status'}`);
        }
    } catch (error) {
        console.error("Status Update Error:", error);
        alert('An error occurred while updating status.');
    }
}

if(markPresentBtn) markPresentBtn.addEventListener('click', () => updateStatus('present'));
if(markAbsentBtn) markAbsentBtn.addEventListener('click', () => updateStatus('absent'));


// ---- HELPERS ----
function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function animateCount(el, target) {
    let start = 0;
    const duration = 900;
    const startTime = performance.now();

    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}


// ---- INIT — render table immediately ----
renderTable(currentData);

