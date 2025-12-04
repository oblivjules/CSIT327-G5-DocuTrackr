// Student Requests List page JS - proof modal handling

document.addEventListener('DOMContentLoaded', () => {
  const proofModal = document.getElementById('proofModal');
  const proofImage = document.getElementById('proofImage');
  const closeBtn = document.querySelector('#proofModal .close-btn');

  function openProofModal(imgUrl) {
    if (!imgUrl) return;
    proofImage.src = imgUrl;
    proofModal.style.display = 'block';
  }

  function closeProofModal() {
    proofModal.style.display = 'none';
    proofImage.src = '';
  }

  document.querySelectorAll('.view-proof-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const imgUrl = btn.getAttribute('data-img-url');
      openProofModal(imgUrl);
    });
  });

  closeBtn?.addEventListener('click', closeProofModal);

  window.addEventListener('click', (event) => {
    if (event.target === proofModal) {
      closeProofModal();
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
      const metaTag = document.querySelector('meta[name="csrf-token"]');
      if (metaTag) return metaTag.content;
      const hiddenInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
      if (hiddenInput) return hiddenInput.value;
      return '';
    }

    if (notifBtn && notifDropdown) {
      notifBtn.addEventListener("click", () => {
        const isOpen = notifDropdown.style.display === "block";
        notifDropdown.style.display = isOpen ? "none" : "block";

        if (!isOpen) {
          fetch("/notifications/api/fetch/", {
            credentials: "include"
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
                const msg = n.message || '';
                const time = n.time || '';
                notifList.innerHTML += `
                  <div class="notif-item ${readClass}">
                    <p>${msg}</p>
                    <span class="time">${time}</span>
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

      const markReadBtn = notifDropdown.querySelector(".mark-read-btn") || document.querySelector(".mark-read-btn");
      if (markReadBtn) {
        markReadBtn.addEventListener("click", () => {
          fetch("/notifications/api/mark-read/", {
            method: 'POST',
            credentials: "include",
            headers: {
              'X-CSRFToken': getCSRFToken(),
              'Content-Type': 'application/json'
            },
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
            .catch(err => console.error('Failed to mark notifications read:', err));
        });
      }

    document.addEventListener("click", (e) => {
      if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
        notifDropdown.style.display = "none";
      }
    });
    }



    document.addEventListener("click", (e) => {
      if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
        notifDropdown.style.display = "none";
      }
    });

  const modal = document.getElementById('requestModal');
  const closeDetailsBtn = modal?.querySelector('.dt-close');
  const requestIdElement = document.getElementById('mRequestId');
  const statusElement = document.getElementById('mStatus');
  const documentElement = document.getElementById('mDocument');
  const copiesElement = document.getElementById('mCopies');
  const dateNeededElement = document.getElementById('mDateNeeded');
  const createdElement = document.getElementById('mCreated');
  const updatedElement = document.getElementById('mUpdated');
  const proofSection = document.getElementById('mProofSection');
  const mProofImage = document.getElementById('mProofImage');

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

  function openRequestModal() {
    if (!modal) return;
    modal.style.display = 'flex';
    lockBodyScroll();
  }

  function closeRequestModal() {
    if (!modal) return;
    modal.style.display = 'none';
    unlockBodyScroll();
    if (mProofImage) mProofImage.removeAttribute('src');
  }

  document.querySelectorAll('.view-details-btn').forEach(button => {
    button.addEventListener('click', () => {
      const requestId = button.dataset.requestId || '';
      const status = button.dataset.status || '';
      const docName = button.dataset.document || '';
      const copies = button.dataset.copies || '—';
      const dateNeeded = button.dataset.dateNeeded || '—';
      const created = button.dataset.created || '—';
      const updated = button.dataset.updated || '—';
      const proofUrl = button.dataset.proofUrl || '';

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

      let imgUrl = proofUrl ? proofUrl.replace(/\u002D/g, "-").trim() : '';
      if (imgUrl) {
        try { imgUrl = decodeURIComponent(imgUrl); } catch (e) {}
        if (imgUrl.startsWith('/media/http')) {
          imgUrl = imgUrl.replace(/^\/media\//, '');
        } else if (!imgUrl.startsWith('http') && !imgUrl.startsWith('/')) {
          imgUrl = '/media/' + imgUrl;
        }
        mProofImage.style.display = 'none';
        mProofImage.onload = function() {
          mProofImage.style.display = 'block';
        };
        mProofImage.onerror = function() {
          mProofImage.removeAttribute('src');
          mProofImage.style.display = 'none';
        };
        mProofImage.src = imgUrl;
        proofSection.style.display = 'block';
      } else {
        mProofImage.removeAttribute('src');
        mProofImage.style.display = 'none';
        proofSection.style.display = 'none';
      }

      openRequestModal();
    });
  });

  closeDetailsBtn?.addEventListener('click', closeRequestModal);
  modal?.addEventListener('click', (e) => { if (e.target === modal) closeRequestModal(); });

});

    const notifBtn = document.getElementById("notifBtn");
    const notifDropdown = document.getElementById("notifDropdown");
    const notifBadge = document.getElementById("notifBadge");

    // Fetch unread count on page load
    function updateNotificationBadge() {
        fetch("/notifications/api/fetch/", { credentials: "include" })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const contentType = res.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    throw new Error("Response is not JSON");
                }
                return res.json();
            })
            .then(data => {
                const unreadCount = data.notifications ? data.notifications.filter(n => !n.is_read).length : 0;
                if (notifBadge) {
                    if (unreadCount > 0) {
                        notifBadge.textContent = unreadCount > 99 ? "99+" : unreadCount;
                        notifBadge.classList.remove("hide");
                    } else {
                        notifBadge.classList.add("hide");
                    }
                }
            })
            .catch(err => {
                console.error('Failed to fetch notification count:', err);
                if (notifBadge) notifBadge.classList.add("hide");
            });
    }

    // Update badge on page load
    updateNotificationBadge();

    // Refresh badge every 30 seconds
    setInterval(updateNotificationBadge, 30000);

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
                        // Update badge after marking as read
                        updateNotificationBadge();
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

