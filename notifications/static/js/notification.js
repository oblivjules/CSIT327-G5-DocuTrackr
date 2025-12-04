function filterNotifications(type, arg) {
    const cards = document.querySelectorAll('.notification-card');
    const buttons = document.querySelectorAll('.filter-btn');

    buttons.forEach(btn => btn.classList.remove('active'));
    if (arg && arg.target) {
        arg.target.classList.add('active');
    } else if (arg && arg.classList) {
        arg.classList.add('active');
    } else {
        buttons.forEach(btn => {
            if (btn.textContent.toLowerCase() === type.toLowerCase() || 
                (type === 'all' && btn.textContent === 'All')) {
                btn.classList.add('active');
            }
        });
    }

    if (type === 'all') {
        cards.forEach(card => card.style.display = 'block');
    } else {
        cards.forEach(card => {
            const cardType = card.getAttribute('data-type');
            card.style.display = cardType === type ? 'block' : 'none';
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const type = this.textContent.toLowerCase();
            filterNotifications(type, e);
        });
    });
});

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

async function fetchDropdownNotifications() {
    try {
        const dd = document.getElementById('notifDropdown');
        if (!dd) return;
        const res = await fetch('/notifications/api/fetch/', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        let list = dd.querySelector('.notif-list');
        if (!list) {
            list = document.createElement('div');
            list.className = 'notif-list';
            const markBtn = dd.querySelector('.mark-read-btn');
            if (markBtn) dd.insertBefore(list, markBtn); else dd.appendChild(list);
        }

        if (!data || !Array.isArray(data.notifications) || data.notifications.length === 0) {
            list.innerHTML = '<div class="notif-item">No notifications yet</div>';
            const existingShowAll = dd.querySelector('.show-all-btn');
            if (existingShowAll) existingShowAll.remove();
        } else {
            list.innerHTML = '';
            data.notifications.forEach(n => {
                const readClass = n.is_read ? '' : 'unread';
                list.innerHTML += `<div class="notif-item ${readClass}"><p>${n.message}</p><span class="time">${n.time}</span></div>`;
            });
            let showAllBtn = dd.querySelector('.show-all-btn');
            if (!showAllBtn) {
                showAllBtn = document.createElement('a');
                showAllBtn.className = 'show-all-btn';
                showAllBtn.href = '/notifications/all/';
                showAllBtn.textContent = 'Show all';
                const markBtn = dd.querySelector('.mark-read-btn');
                if (markBtn) dd.insertBefore(showAllBtn, markBtn); else dd.appendChild(showAllBtn);
            }
        }

        const badge = document.getElementById('notifBadge');
        const unread = data.unread_count || 0;
        if (badge) {
            if (unread > 0) { badge.textContent = unread; badge.classList.remove('hide'); } else { badge.textContent = ''; badge.classList.add('hide'); }
        }
    } catch (e) {}
}

async function markAllRead() {
    try {
        const csrftoken = getCookie('csrftoken');
        const res = await fetch('/notifications/api/mark-read/', { method: 'POST', headers: { 'X-CSRFToken': csrftoken } });
        if (!res.ok) return;
        await fetchDropdownNotifications();
    } catch (e) {}
}

function initNotifDropdown() {
    const btn = document.getElementById('notifBtn');
    const dd = document.getElementById('notifDropdown');
    const markBtn = dd ? dd.querySelector('.mark-read-btn') : null;
    if (btn && dd) {
        btn.addEventListener('click', () => {
            const show = dd.style.display === 'block';
            dd.style.display = show ? 'none' : 'block';
            if (!show) fetchDropdownNotifications();
        });
        document.addEventListener('click', (e) => {
            if (!dd.contains(e.target) && !btn.contains(e.target)) dd.style.display = 'none';
        });
    }
    if (markBtn) markBtn.addEventListener('click', markAllRead);
    fetchDropdownNotifications();
    setInterval(fetchDropdownNotifications, 30000);
}

document.addEventListener('DOMContentLoaded', initNotifDropdown);

async function markOneRead(id) {
    try {
        const csrftoken = getCookie('csrftoken');
        const res = await fetch(`/notifications/api/mark-one/${id}/`, { method: 'POST', headers: { 'X-CSRFToken': csrftoken } });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) { return null; }
}

function bindPerCardMarkRead() {
    const buttons = document.querySelectorAll('.mark-one-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const id = btn.getAttribute('data-notif-id');
            if (!id) return;
            btn.disabled = true;
            const data = await markOneRead(id);
            if (data && data.success) {
                btn.style.display = 'none';
            } else {
                btn.disabled = false;
            }
            const card = btn.closest('.notification-card');
            if (card) {
                card.classList.remove('unread');
                const status = card.getAttribute('data-status') || '';
                if (status) card.setAttribute('data-type', status);
            }
            const badge = document.getElementById('notifBadge');
            if (badge && data) {
                const unread = data.unread_count || 0;
                if (unread > 0) { badge.textContent = unread > 99 ? '99+' : unread; badge.classList.remove('hide'); }
                else { badge.textContent = ''; badge.classList.add('hide'); }
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', bindPerCardMarkRead);
