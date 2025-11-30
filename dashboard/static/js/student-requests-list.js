// Student Requests List page JS - proof modal handling

document.addEventListener('DOMContentLoaded', () => {
  const proofModal = document.getElementById('proofModal');
  const proofImage = document.getElementById('proofImage');
  const closeBtn = document.querySelector('#proofModal .close-btn');

  function openModal(imgUrl) {
    if (!imgUrl) return;
    proofImage.src = imgUrl;
    proofModal.style.display = 'block';
  }

  function closeModal() {
    proofModal.style.display = 'none';
    proofImage.src = '';
  }

  document.querySelectorAll('.view-proof-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const imgUrl = btn.getAttribute('data-img-url');
      openModal(imgUrl);
    });
  });

  closeBtn?.addEventListener('click', closeModal);

  window.addEventListener('click', (event) => {
    if (event.target === proofModal) {
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

});