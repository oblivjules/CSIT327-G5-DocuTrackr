document.addEventListener('DOMContentLoaded', function() {

    /* -------------------------------------------------------------
     *   HEIGHT SYNC (Recent Activity card)
     * ----------------------------------------------------------- */
    function syncActivityHeight() {
        const recent = document.querySelector('.dashboard-row.two-up .recent-requests');
        const activity = document.querySelector('.dashboard-row.two-up .activity-section');
        if (!recent || !activity) return;

        const height = recent.offsetHeight;
        if (height && Math.abs(activity.offsetHeight - height) > 2) {
            activity.style.height = height + 'px';
        }
    }

    requestAnimationFrame(syncActivityHeight);

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(syncActivityHeight, 100);
    });

    const modal = document.getElementById('requestModal');

    const closeButton = modal?.querySelector('.dt-close');
    const requestIdElement = document.getElementById('mRequestId');
    const statusElement = document.getElementById('mStatus');
    const documentElement = document.getElementById('mDocument');
    const copiesElement = document.getElementById('mCopies');
    const dateNeededElement = document.getElementById('mDateNeeded');
    const createdElement = document.getElementById('mCreated');
    const updatedElement = document.getElementById('mUpdated');
    const proofSection = document.getElementById('mProofSection');
    const proofImage = document.getElementById('mProofImage');

    function getScrollbarWidth() {
        return window.innerWidth - document.documentElement.clientWidth;
    }

    function lockBodyScroll() {
        const w = getScrollbarWidth();
        document.body.style.overflow = 'hidden';
        if (w > 0) document.body.style.paddingRight = w + 'px';
    }

    function unlockBodyScroll() {
        document.body.style.overflow = 'auto';
        document.body.style.paddingRight = '';
    }

    function openModal() {
        if (!modal) return;
        modal.style.display = 'flex';
        lockBodyScroll();
    }

    function closeModal() {
        if (!modal) return;
        modal.style.display = 'none';
        unlockBodyScroll();
    }

    const viewDetailsButtons = document.querySelectorAll('.view-details-btn');

    viewDetailsButtons.forEach(button => {
        button.addEventListener('click', function() {

            const requestId = button.dataset.requestId || '';
            const status = button.dataset.status || '';
            const docName = button.dataset.document || '';
            const copies = button.dataset.copies || '—';
            const dateNeeded = button.dataset.dateNeeded || '—';
            const created = button.dataset.created || '—';
            const updated = button.dataset.updated || '—';
            const proofUrl = button.dataset.proofUrl;

            if (requestIdElement) requestIdElement.textContent = `REQ-${requestId}`;
            if (statusElement) {
                statusElement.textContent = status;
                statusElement.className = 'dt-status-badge ' + status.toLowerCase();
            }
            if (documentElement) documentElement.textContent = docName;
            if (copiesElement) copiesElement.textContent = copies;
            if (dateNeededElement) dateNeededElement.textContent = dateNeeded;
            if (createdElement) createdElement.textContent = created;
            if (updatedElement) updatedElement.textContent = updated;

            let imgUrl = proofUrl ? proofUrl.replace(/\\u002D/g, "-").trim() : "";

            if (imgUrl) {
                try { imgUrl = decodeURIComponent(imgUrl); } catch (e) {}
            }

            proofSection.style.display = 'block';

            function showPlaceholder() {
                proofImage.removeAttribute('src');
                proofImage.style.display = 'none';

                let placeholder = proofSection.querySelector('.proof-not-available');
                if (!placeholder) {
                    placeholder = document.createElement('div');
                    placeholder.className = 'proof-not-available';
                    placeholder.style.color = '#666';
                    placeholder.style.fontStyle = 'italic';
                    placeholder.style.padding = '8px 0';
                    proofSection.appendChild(placeholder);
                }
                placeholder.textContent = 'Not available';
                placeholder.style.display = 'block';
            }

            function hidePlaceholder() {
                const placeholder = proofSection.querySelector('.proof-not-available');
                if (placeholder) placeholder.style.display = 'none';
            }

            if (imgUrl) {
                if (imgUrl.startsWith('/media/http')) {
                    imgUrl = imgUrl.replace(/^\/media\//, '');
                } else if (!imgUrl.startsWith('http') && !imgUrl.startsWith('/')) {
                    imgUrl = '/media/' + imgUrl;
                }

                proofImage.style.display = 'none';

                proofImage.onload = function() {
                    hidePlaceholder();
                    proofImage.style.display = 'block';
                };

                proofImage.onerror = function() {
                    showPlaceholder();
                };

                proofImage.src = imgUrl;
            } else {
                showPlaceholder();
            }

            openModal();
        });
    });

    closeButton?.addEventListener('click', closeModal);

    modal?.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    const notifBtn = document.getElementById("notifBtn");
    const notifDropdown = document.getElementById("notifDropdown");

    function getCSRFToken() {
        const cookies = document.cookie ? document.cookie.split(';') : [];
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'csrftoken') return value;
        }
        return '';
    }

    if (notifBtn && notifDropdown) {
        notifBtn.addEventListener("click", () => {
            const isOpen = notifDropdown.style.display === "block";
            notifDropdown.style.display = isOpen ? "none" : "block";

            if (!isOpen) {
                fetch("/notifications/api/fetch/", { credentials: "include" })
                    .then(res => {
                        if (!res.ok) {
                            throw new Error(`HTTP error! status: ${res.status}`);
                        }
                        // Check if response is JSON
                        const contentType = res.headers.get("content-type");
                        if (!contentType || !contentType.includes("application/json")) {
                            throw new Error("Response is not JSON");
                        }
                        return res.json();
                    })
                    .then(data => {
                        let notifList = notifDropdown.querySelector(".notif-list");

                        if (!notifList) {
                            notifList = document.createElement('div');
                            notifList.className = 'notif-list';

                            const markBtn = notifDropdown.querySelector('.mark-read-btn');
                            if (markBtn) notifDropdown.insertBefore(notifList, markBtn);
                            else notifDropdown.appendChild(notifList);
                        }

                        notifList.innerHTML = "";

                        if (!data || !Array.isArray(data.notifications) || data.notifications.length === 0) {
                            notifList.innerHTML = `<div class="notif-item">No notifications yet</div>`;
                            // Remove show all button if it exists
                            const showAllBtn = notifDropdown.querySelector(".show-all-btn");
                            if (showAllBtn) showAllBtn.remove();
                            return;
                        }

                        data.notifications.forEach(n => {
                            const readClass = n.is_read ? "" : "unread";
                            notifList.innerHTML += `
                                <div class="notif-item ${readClass}">
                                    <p>${n.message}</p>
                                    <span class="time">${n.time}</span>
                                </div>
                            `;
                        });

                        // Add "Show all" button if notifications exist
                        let showAllBtn = notifDropdown.querySelector(".show-all-btn");
                        if (!showAllBtn) {
                            showAllBtn = document.createElement('a');
                            showAllBtn.className = 'show-all-btn';
                            showAllBtn.href = '/notifications/all/';
                            showAllBtn.textContent = 'Show all';
                            const markBtn = notifDropdown.querySelector('.mark-read-btn');
                            if (markBtn) {
                                notifDropdown.insertBefore(showAllBtn, markBtn);
                            } else {
                                notifDropdown.appendChild(showAllBtn);
                            }
                        }
                    })
                    .catch(err => {
                        console.error('Failed to fetch notifications:', err);
                        let notifList = notifDropdown.querySelector(".notif-list");
                        if (!notifList) {
                            notifList = document.createElement('div');
                            notifList.className = 'notif-list';
                            const markBtn = notifDropdown.querySelector('.mark-read-btn');
                            if (markBtn) notifDropdown.insertBefore(notifList, markBtn);
                            else notifDropdown.appendChild(notifList);
                        }
                        notifList.innerHTML = `<div class="notif-item">Error loading notifications. Please refresh.</div>`;
                    });
            }
        });

        const markReadBtn = notifDropdown.querySelector(".mark-read-btn");
        if (markReadBtn) {
            markReadBtn.addEventListener("click", () => {
                fetch("/notifications/api/mark-read/", {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "X-CSRFToken": getCSRFToken(),
                        "Content-Type": "application/json"
                    }
                })
                    .then(res => {
                        if (!res.ok) {
                            throw new Error(`HTTP error! status: ${res.status}`);
                        }
                        const contentType = res.headers.get("content-type");
                        if (!contentType || !contentType.includes("application/json")) {
                            throw new Error("Response is not JSON");
                        }
                        return res.json();
                    })
                    .then(() => {
                        document.querySelectorAll(".notif-item.unread")
                            .forEach(i => i.classList.remove("unread"));
                    })
                    .catch(err => {
                        console.error('Failed to mark notifications read:', err);
                    });
            });
        }

        document.addEventListener("click", (e) => {
            if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
                notifDropdown.style.display = "none";
            }
        });
    }

    const searchInput = document.querySelector('input[name="search"]');
    const searchForm = document.querySelector('.search-form');

    if (searchInput && searchForm) {
        let typingTimer;

        searchInput.addEventListener('input', function () {
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => {
                if (this.value.length >= 2 || this.value.length === 0) {
                    searchForm.submit();
                }
            }, 500);
        });

        document.addEventListener('keydown', function (e) {
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            }
        });
    }

});
