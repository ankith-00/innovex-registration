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
const eventFilter = document.getElementById('eventFilter');   // admin only
const searchInput = document.getElementById('searchInput');   // admin only


// ---- LOGOUT ----
logoutBtn.addEventListener('click', () => {
    document.cookie = 'token=; path=/; max-age=0; SameSite=Strict';
    window.location.href = '/login';
});


// ---- STATS (animated counters) ----
const uniqueEvents = [...new Set(registrations.map(r => r.eventName))].length;

animateCount(totalCountEl, totalCount);
animateCount(eventCountEl, isAdmin ? uniqueEvents : totalCount);


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
    totalCountEl.textContent = filtered.length;
}


// ---- RENDER TABLE ----
function renderTable(data) {
    tableBody.innerHTML = '';

    const colspan = isAdmin ? 9 : 8;

    if (!data.length) {
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="${colspan}">NO REGISTRATIONS FOUND</td>
            </tr>`;
        return;
    }

    data.forEach((reg, index) => {
        // Build numbered member list
        const memberItems = Array.isArray(reg.members)
            ? reg.members.map((m, i) => `<span class="member-item"><span class="member-num">${i + 1}.</span> ${escHtml(m)}</span>`).join('')
            : (reg.members ? `<span class="member-item"><span class="member-num">1.</span> ${escHtml(reg.members)}</span>` : '—');

        const row = document.createElement('tr');

        // Action cell – only for admin
        const actionCell = isAdmin
            ? `<td class="td-action"><button class="btn-edit-info" onclick="openEditModal('${reg._id}')">Edit Info</button></td>`
            : '';

        row.innerHTML = `
            <td class="td-number">${index + 1}</td>
            <td class="td-event">${escHtml(reg.eventName || '—')}</td>
            <td class="td-members">
                ${reg.teamName ? `<span class="team-name">${escHtml(reg.teamName)}</span>` : ''}
                <span class="member-list">${memberItems}</span>
            </td>
            <td>${escHtml(reg.collegeName || '—')}</td>
            <td>${escHtml(reg.email || '—')}</td>
            <td>${escHtml(reg.phoneNo || '—')}</td>
            <td class="td-utr">${escHtml(reg.utrNo || '—')}</td>
            <td class="td-att">${attendancePill(reg.attendance)}</td>
            ${actionCell}
        `;
        tableBody.appendChild(row);
    });
}


// ---- EDIT INFO MODAL (admin only) ----
const editModal = document.getElementById('editModal');
const editModalBody = document.getElementById('editModalBody');
const editModalClose = document.getElementById('editModalClose');
const editCancelBtn = document.getElementById('editCancelBtn');
const editUpdateBtn = document.getElementById('editUpdateBtn');

let editingRegId = null;

window.openEditModal = function (id) {
    const reg = registrations.find(r => r._id === id);
    if (!reg) return;

    editingRegId = id;

    // Build members rows
    const members = Array.isArray(reg.members) ? reg.members : (reg.members ? [reg.members] : []);
    const memberInputs = members.map((m, i) => `
        <div class="edit-field-group">
            <label class="edit-label">Member ${i + 1}</label>
            <input class="edit-input member-input" type="text" data-index="${i}" value="${escAttr(m)}" />
        </div>
    `).join('');

    editModalBody.innerHTML = `
        <div class="edit-field-group">
            <label class="edit-label">Team Name</label>
            <input class="edit-input" id="ef-teamName" type="text" value="${escAttr(reg.teamName || '')}" />
        </div>
        <div class="edit-field-group">
            <label class="edit-label">Event</label>
            <input class="edit-input" id="ef-eventName" type="text" value="${escAttr(reg.eventName || '')}" />
        </div>
        <div class="edit-field-group">
            <label class="edit-label">College</label>
            <input class="edit-input" id="ef-collegeName" type="text" value="${escAttr(reg.collegeName || '')}" />
        </div>
        <div class="edit-field-group">
            <label class="edit-label">Email</label>
            <input class="edit-input" id="ef-email" type="email" value="${escAttr(reg.email || '')}" />
        </div>
        <div class="edit-field-group">
            <label class="edit-label">Phone</label>
            <input class="edit-input" id="ef-phoneNo" type="text" value="${escAttr(reg.phoneNo || '')}" />
        </div>
        <div class="edit-field-group">
            <label class="edit-label">UTR No.</label>
            <input class="edit-input" id="ef-utrNo" type="text" value="${escAttr(reg.utrNo || '')}" />
        </div>
        ${memberInputs ? `<div class="edit-section-label">Team Members</div>${memberInputs}` : ''}
        <div class="edit-field-group">
            <label class="edit-label">Team Presence</label>
            <select class="edit-select" id="ef-attendance">
                <option value="" ${!reg.attendance ? 'selected' : ''}>— Not Marked —</option>
                <option value="present" ${reg.attendance === 'present' ? 'selected' : ''}>Present</option>
                <option value="absent"  ${reg.attendance === 'absent' ? 'selected' : ''}>Absent</option>
            </select>
        </div>
    `;

    editModal.style.display = 'flex';
};

function closeEditModal() {
    if (editModal) editModal.style.display = 'none';
    editingRegId = null;
}

if (editModalClose) editModalClose.addEventListener('click', closeEditModal);
if (editCancelBtn) editCancelBtn.addEventListener('click', closeEditModal);

// Close on overlay click
if (editModal) {
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) closeEditModal();
    });
}

if (editUpdateBtn) {
    editUpdateBtn.addEventListener('click', async () => {
        if (!editingRegId) return;

        // Gather updated member values
        const memberInputs = editModalBody.querySelectorAll('.member-input');
        const updatedMembers = Array.from(memberInputs).map(inp => inp.value.trim());

        const payload = {
            teamName: document.getElementById('ef-teamName')?.value.trim() || '',
            eventName: document.getElementById('ef-eventName')?.value.trim() || '',
            collegeName: document.getElementById('ef-collegeName')?.value.trim() || '',
            email: document.getElementById('ef-email')?.value.trim() || '',
            phoneNo: document.getElementById('ef-phoneNo')?.value.trim() || '',
            utrNo: document.getElementById('ef-utrNo')?.value.trim() || '',
            attendance: document.getElementById('ef-attendance')?.value || '',
            members: updatedMembers
        };

        editUpdateBtn.textContent = 'Saving…';
        editUpdateBtn.disabled = true;

        try {
            const response = await fetch(`/login/dashboard/update/${editingRegId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                // Sync local data
                const idx = registrations.findIndex(r => r._id === editingRegId);
                if (idx !== -1) Object.assign(registrations[idx], payload);
                applyFilters();
                closeEditModal();
                showToast('Registration updated successfully', 'success');
            } else {
                showToast(`Update failed: ${result.message || 'Unknown error'}`, 'error');
            }
        } catch (err) {
            console.error('Update error:', err);
            showToast('Network error — could not save changes', 'error');
        } finally {
            editUpdateBtn.textContent = 'Update Info';
            editUpdateBtn.disabled = false;
        }
    });
}


// ---- HELPERS ----
function attendancePill(status) {
    if (status === 'present') {
        return `<span class="att-pill att-present">Present</span>`;
    } else if (status === 'absent') {
        return `<span class="att-pill att-absent">Absent</span>`;
    } else if (status === 'verified') {
        return `<span class="att-pill" style="background: rgba(0, 191, 255, 0.12); border: 1px solid rgba(0, 191, 255, 0.45); color: #00bfff;">Verified</span>`;
    }
    return `<span class="att-pill att-none">—</span>`;
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function escAttr(str) {
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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
