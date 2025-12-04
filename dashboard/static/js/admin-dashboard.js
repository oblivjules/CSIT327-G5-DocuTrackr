document.addEventListener('DOMContentLoaded', function() {

  const proofModal = document.getElementById("proofModal");
  const proofImage = document.getElementById("proofImage");
  const proofClose = proofModal?.querySelector(".close-btn");

  const proofButtons = document.querySelectorAll(".view-proof-btn");

  const requestModal = document.getElementById("requestModal");
  if (requestModal) {
    requestModal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }

  const dateReady = document.getElementById("dateReady");
  if (dateReady) {
    const today = new Date().toISOString().split("T")[0];
    dateReady.min = today;
}

  const processModal = document.getElementById("processModal");
  const statusDropdown = document.getElementById("statusDropdown");
  const remarksField = document.getElementById("remarks");
  const confirmProcess = document.getElementById("confirmProcess");
  const cancelProcess = document.getElementById("cancelProcess");
  const closeProcessBtn = document.getElementById("closeModal");
  const requestIdField = document.getElementById("requestId");

  const searchInput = document.querySelector('input[name="search"]');
  const searchForm = document.querySelector('.search-form');
  const filterSelect = document.querySelector('.filter-select');

  if (!statusDropdown) console.warn("statusDropdown not found — some status UI will be degraded.");
  if (!confirmProcess) console.warn("confirmProcess button not found.");
  if (!processModal) console.warn("processModal not found — cannot update statuses.");

  function updateDateReadyState() {
    if (!statusDropdown || !dateReady) return;
    
    const status = statusDropdown.value.toLowerCase();

    if (status === "approved") {
        dateReady.disabled = false;
        // Set min date to today
        const today = new Date().toISOString().split("T")[0];
        dateReady.min = today;
        
        // ONLY set to today if the field is COMPLETELY empty
        // NEVER overwrite if user has already entered a date
        if (!dateReady.value || dateReady.value.trim() === "") {
            dateReady.value = today;
        }
        // If it has a value, LEAVE IT ALONE!

    } else {
        dateReady.disabled = true;
        dateReady.value = "";
    }
}

// Only update when status dropdown changes - don't auto-update on page load
statusDropdown.addEventListener("change", updateDateReadyState);
// Don't call updateDateReadyState() on page load - let user set the date manually

  function getCSRFToken() {
    let csrfToken = null;
    const cookies = document.cookie ? document.cookie.split(';') : [];
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') {
        csrfToken = value;
        break;
      }
    }
    if (!csrfToken) {
      const metaTag = document.querySelector('meta[name="csrf-token"]');
      if (metaTag) csrfToken = metaTag.content;
      else {
        const hiddenInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
        if (hiddenInput) csrfToken = hiddenInput.value;
      }
    }
    return csrfToken || '';
  }

  const isValidTransition = (current, next) => {
    if (current === next) return true;
    if (current === "pending") return next === "processing" || next === "rejected";
    if (current === "processing") return next === "approved" || next === "rejected";
    if (current === "approved") return next === "completed";
    if (current === "completed") return next === "completed";
    return false;
  };

  const validNextStatuses = (status) => {
    if (status === 'pending') return ['processing', 'rejected'];
    if (status === 'processing') return ['approved', 'rejected'];
    if (status === 'approved') return ['completed'];
    if (status === 'completed') return ['completed'];
    return [];
  };

  function getRowCurrentStatus(id) {
    const row = document.querySelector(`tr[data-request-id="${id}"]`);
    return row?.querySelector('.status-cell .badge')?.textContent?.trim().toLowerCase() || '';
  }

  let csContainer = null;
  let csDisplay = null;
  let csList = null;

  function mountCleanSelect() {
    if (!statusDropdown) return;
    if (csContainer) return;
    const field = statusDropdown.closest('.form-field');
    if (!field) return;
    csContainer = document.createElement('div');
    csContainer.className = 'clean-select';
    csDisplay = document.createElement('button');
    csDisplay.type = 'button';
    csDisplay.className = 'cs-display';
    csList = document.createElement('div');
    csList.className = 'cs-list';
    csContainer.appendChild(csDisplay);
    csContainer.appendChild(csList);
    field.appendChild(csContainer);
    statusDropdown.classList.add('native-select-hidden');
    statusDropdown.tabIndex = -1;

    csDisplay.addEventListener('click', (e) => {
      e.stopPropagation();
      csContainer.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!csContainer) return;
      if (!csContainer.contains(e.target) && csContainer.classList.contains('open')) {
        csContainer.classList.remove('open');
      }
    });
  }

  function rebuildCleanSelect() {
    if (!csContainer || !statusDropdown) return;
    csList.innerHTML = '';
    const opts = Array.from(statusDropdown.querySelectorAll('option'));
    const selectedOpt = opts.find(o => o.value === statusDropdown.value);
    csDisplay.textContent = selectedOpt ? selectedOpt.textContent : 'Select status';
    opts.forEach(opt => {
      const item = document.createElement('div');
      item.className = 'cs-item' + (opt.disabled ? ' disabled' : '');
      item.textContent = opt.textContent;
      item.addEventListener('click', () => {
        if (opt.disabled) return;

        statusDropdown.value = opt.value;
        csDisplay.textContent = opt.textContent;
        csContainer.classList.remove('open');
        updateDateReadyState();
      });
      csList.appendChild(item);
    });
  }

  const applyDisabledForCurrentStatus = (status) => {
    if (!statusDropdown) return;
    const optProcessing = statusDropdown.querySelector("option[value='processing']");
    const optApproved = statusDropdown.querySelector("option[value='approved']");
    const optRejected = statusDropdown.querySelector("option[value='rejected']");
    const optCompleted = statusDropdown.querySelector("option[value='completed']");

    [optProcessing, optApproved, optRejected, optCompleted].forEach((opt) => {
      if (opt) opt.disabled = false;
    });

    if (status === "approved") {
      if (optProcessing) optProcessing.disabled = true;
      if (optRejected) optRejected.disabled = true;
      if (optApproved) optApproved.disabled = true;
      if (optCompleted) optCompleted.disabled = false;
    } else if (status === "pending") {
      if (optRejected) optRejected.disabled = false;
      if (optApproved) optApproved.disabled = true;
      if (optCompleted) optCompleted.disabled = true;
    } else if (status === "processing") {
      if (optProcessing) optProcessing.disabled = true;
      if (optRejected) optRejected.disabled = false;
      if (optCompleted) optCompleted.disabled = true;
    } else if (status === "completed") {
      [optProcessing, optApproved, optRejected].forEach((opt) => {
        if (opt) opt.disabled = true;
      });
      if (optCompleted) optCompleted.disabled = false;
    } else {
      if (optCompleted) optCompleted.disabled = true;
    }

    rebuildCleanSelect();
  };

  const applyDisabledForSelection = (validSet) => {
    if (!statusDropdown) return;
    const opts = ['processing','approved','rejected','completed'];
    opts.forEach(v => {
      const o = statusDropdown.querySelector(`option[value='${v}']`);
      if (o) o.disabled = !validSet.has(v);
    });
    rebuildCleanSelect();
  };

  proofButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      let imgUrl = btn.getAttribute("data-img-url") || "";
      imgUrl = imgUrl.replace(/\\u002D/g, "-").trim();

      if (!imgUrl) {
        alert("No proof URL provided.");
        return;
      }

      if (!imgUrl.startsWith('http') && !imgUrl.startsWith('/')) {
        imgUrl = '/media/' + imgUrl;
      }

      proofImage.src = imgUrl;

      proofImage.onload = () => {
        if (proofModal) {
          proofModal.style.display = "flex";
          document.body.style.overflow = "hidden";
        }
      };

      proofImage.onerror = () => {
        console.error("Failed to load proof image:", imgUrl);
        alert("Unable to display image. Please check if the proof file exists.");
      };
    });
  });

  proofClose?.addEventListener("click", () => {
    if (proofModal) proofModal.style.display = "none";
    if (proofImage) proofImage.removeAttribute("src");
    document.body.style.overflow = "auto";
  });

  proofModal?.addEventListener("click", (e) => {
    if (e.target === proofModal) {
      proofModal.style.display = "none";
      proofImage.removeAttribute("src");
      document.body.style.overflow = "auto";
    }
  });


  if (requestModal) {
    const requestCloseBtn = requestModal.querySelector(".dt-close");

    const mRequestId = document.getElementById("mRequestId");
    const mStatus = document.getElementById("mStatus");
    const mDocument = document.getElementById("mDocument");
    const mCopies = document.getElementById("mCopies");
    const mDateNeeded = document.getElementById("mDateNeeded");
    const mCreated = document.getElementById("mCreated");
    const mUpdated = document.getElementById("mUpdated");
    const mRemarks = document.getElementById("mRemarks");
    const mProofSection = document.getElementById("mProofSection");
    const mProofImage = document.getElementById("mProofImage");

    function showPlaceholder() {
      if (!mProofSection) return;
      if (mProofImage) mProofImage.removeAttribute('src');
      let placeholder = mProofSection.querySelector('.proof-not-available');
      if (!placeholder) {
        placeholder = document.createElement('div');
        placeholder.className = 'proof-not-available';
        placeholder.style.color = '#666';
        placeholder.style.fontStyle = 'italic';
        placeholder.style.padding = '8px 0';
        mProofSection.appendChild(placeholder);
      }
      placeholder.textContent = 'Not available';
      placeholder.style.display = 'block';
      if (mProofImage) mProofImage.style.display = 'none';
    }

    function hidePlaceholder() {
      if (!mProofSection) return;
      const placeholder = mProofSection.querySelector('.proof-not-available');
      if (placeholder) placeholder.style.display = 'none';
    }

    function openRequestModal() {
      requestModal.style.display = "flex";
      lockBodyScroll();
    }

    function closeRequestModal() {
      requestModal.style.display = "none";
      unlockBodyScroll();
      if (mProofImage) mProofImage.removeAttribute('src');
    }

    const detailsButtons = document.querySelectorAll('.view-details-btn:not([data-handled-by-requests-list])');
    if (detailsButtons.length > 0) {
      console.log('admin-dashboard.js: Setting up', detailsButtons.length, 'view-details buttons');
    }
    detailsButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const requestId = button.dataset.requestId || '';
        const status = button.dataset.status || '';
        const docName = button.dataset.document || '';
        const copies = button.dataset.copies || '—';
        const dateNeeded = button.dataset.dateNeeded || '—';
        const created = button.dataset.created || '—';
        const updated = button.dataset.updated || '—';
        let proofUrl = button.dataset.proofUrl || '';
        const remarks = button.dataset.remarks || '—';

        if (mRequestId) mRequestId.textContent = `REQ-${requestId}`;
        if (mStatus) {
          mStatus.textContent = status;
          mStatus.className = 'dt-status-badge ' + status.toLowerCase();
        }
        if (mDocument) mDocument.textContent = docName;
        if (mCopies) mCopies.textContent = copies;
        if (mDateNeeded) mDateNeeded.textContent = dateNeeded;
        if (mCreated) mCreated.textContent = created;
        if (mUpdated) mUpdated.textContent = updated;
        if (mRemarks) mRemarks.textContent = remarks;

        let imgUrl = proofUrl ? proofUrl.replace(/\\u002D/g, "-").trim() : '';
        if (imgUrl) {
          try { imgUrl = decodeURIComponent(imgUrl); } catch (e) {}
        }

        if (mProofSection) mProofSection.style.display = 'block';

        if (imgUrl) {
          if (imgUrl.startsWith('/media/http')) {
            imgUrl = imgUrl.replace(/^\/media\//, '');
          } else if (!imgUrl.startsWith('http') && !imgUrl.startsWith('/')) {
            imgUrl = '/media/' + imgUrl;
          }

          if (mProofImage) mProofImage.style.display = 'none';
          if (mProofImage) {
            mProofImage.onload = function() {
              hidePlaceholder();
              mProofImage.style.display = 'block';
            };
            mProofImage.onerror = function() {
              console.error('Failed to load proof image (details modal):', imgUrl);
              showPlaceholder();
            };
            mProofImage.src = imgUrl;
          } else {
            showPlaceholder();
          }
        } else {
          showPlaceholder();
        }

        openRequestModal();
      });
    });

    requestCloseBtn?.addEventListener('click', closeRequestModal);

    requestModal.addEventListener('click', (e) => {
      if (e.target === requestModal) closeRequestModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && requestModal.style.display === 'flex') closeRequestModal();
    });
  }

  let selectedRequestId = null;
  let confirmBound = false;

  function getScrollbarWidth() {
    return window.innerWidth - document.documentElement.clientWidth;
  }

  function lockBodyScroll() {
    const sw = getScrollbarWidth();
    document.body.style.overflow = "hidden";
    if (sw > 0) document.body.style.paddingRight = sw + "px";
  }

  function unlockBodyScroll() {
    document.body.style.overflow = "auto";
    document.body.style.paddingRight = "";
  }

  const processButtons = document.querySelectorAll(".process-btn");

  processButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedRequestId = btn.dataset.requestId;
      const ids = [String(selectedRequestId)].filter(Boolean);

      const label = ids.map(id => `REQ-${id}`).join(', ');
      if (requestIdField) requestIdField.textContent = label;
      if (remarksField) remarksField.value = "";
      
      // Clear date field when modal opens - user will set it
      if (dateReady) {
        dateReady.value = "";
      }

      const row = btn.closest("tr");
      const currentStatus = row?.querySelector(".badge")?.textContent?.trim().toLowerCase() || '';
      if (statusDropdown) {
        statusDropdown.value = currentStatus === 'pending' ? '' : currentStatus;
        mountCleanSelect();
        rebuildCleanSelect();
        if (currentStatus) applyDisabledForCurrentStatus(currentStatus);
      }

      if (processModal) {
        processModal.style.display = "flex";
        lockBodyScroll();
        setTimeout(() => statusDropdown?.focus(), 50);
      }
    });
  });

  function closeProcessModal() {
    if (processModal) processModal.style.display = "none";
    unlockBodyScroll();
    selectedRequestId = null;
  }

  // close handlers
  [closeProcessBtn, cancelProcess].forEach(el => {
    if (el) el.addEventListener("click", closeProcessModal);
  });

  processModal?.addEventListener("click", (e) => {
    if (e.target === processModal) closeProcessModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && processModal?.style.display === "flex") closeProcessModal();
  });

  if (!confirmBound && confirmProcess) {
    confirmBound = true;

    confirmProcess.addEventListener("click", async () => {
      if (!selectedRequestId) {
        alert("No request selected.");
        return;
      }

      const newStatus = statusDropdown?.value;
      const remarks = remarksField?.value.trim() || '';

      if (!newStatus) {
        alert("Please select a status.");
        return;
      }

      const idsToUpdate = [String(selectedRequestId)].filter(Boolean);

      if (idsToUpdate.length === 0) {
        alert("Please select at least one request to update.");
        return;
      }

      const validIds = [];
      const invalid = [];
      idsToUpdate.forEach(id => {
        const cs = getRowCurrentStatus(id);
        if (isValidTransition(cs, newStatus)) validIds.push(id);
        else invalid.push({id, cs});
      });

      if (!validIds.length) {
        alert(`None of the selected requests can transition to ${newStatus.toUpperCase()}.`);
        return;
      }

      let confirmMsg = (validIds.length === 1)
        ? `Are you sure you want to set REQ-${validIds[0]} to ${newStatus.toUpperCase()}?`
        : `Are you sure you want to set ${validIds.length} requests to ${newStatus.toUpperCase()}?`;

      if (newStatus === 'approved') confirmMsg += `\nThis will generate a claim slip.`;

      if (invalid.length) {
        const list = invalid.slice(0,5).map(x => `REQ-${x.id} (${x.cs.toUpperCase()})`).join(', ');
        confirmMsg += `\n\n${invalid.length} selected request(s) cannot move to ${newStatus.toUpperCase()} and will be skipped` + (invalid.length>5?` (showing first 5): ${list}`:`: ${list}`);
      }

      if (!confirm(confirmMsg)) return;

      confirmProcess.disabled = true;
      const originalText = confirmProcess.textContent;
      confirmProcess.textContent = "Updating...";

      try {
        const firstId = String(validIds[0]);
        
        // Get date_ready value - read DIRECTLY from DOM right before sending
        let dateReadyValue = null;
        if (newStatus === 'approved') {
          const dateInput = document.getElementById("dateReady");
          if (dateInput) {
            // Make sure field is enabled
            if (dateInput.disabled) {
              dateInput.disabled = false;
            }
            
            // Get the value
            dateReadyValue = dateInput.value ? dateInput.value.trim() : null;
            
            // If empty, use today as default
            if (!dateReadyValue) {
              dateReadyValue = new Date().toISOString().split("T")[0];
            }
          } else {
            // If input not found, use today
            dateReadyValue = new Date().toISOString().split("T")[0];
          }
        }
        
        const res = await fetch(`/dashboard/update-status/${firstId}/`, {
          method: "POST",
          headers: {
            "X-CSRFToken": getCSRFToken(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
            remarks: remarks,
            date_ready: dateReadyValue
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Server returned ${res.status}`);
        }

        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || "Unknown error occurred");
        }

        const results = [];
        results.push({ id: firstId, success: true, claim_slip: data.claim_slip });

        for (const id of validIds.filter(x => String(x) !== firstId)) {
          const r = await fetch(`/dashboard/update-status/${id}/`, {
            method: "POST",
            headers: { "X-CSRFToken": getCSRFToken(), "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus, remarks })
          });
          let d = {};
          try { d = await r.json(); } catch {}
          if (!r.ok || !d.success) results.push({ id, success: false, error: (d && d.error) || `Server ${r.status}` });
          else results.push({ id, success: true, claim_slip: d.claim_slip });
        }

        closeProcessModal();

        const successIds = results.filter(r => r.success).map(r => `REQ-${r.id}`);
        const errorItems = results.filter(r => !r.success).map(r => `REQ-${r.id}: ${r.error}`);
        let msg = `Updated ${successIds.length} request(s) to ${newStatus.toUpperCase()} successfully.`;
        const anyClaim = results.some(r => r.success && r.claim_slip);
        if (anyClaim) msg += `\nClaim slip generated for approved requests.`;
        if (errorItems.length) msg += `\n\nFailed:\n` + errorItems.join("\n");

        alert(msg);
        selectedRequestId = null;
        window.location.reload();

      } catch (err) {
        console.error("Update failed:", err);
        confirmProcess.disabled = false;
        confirmProcess.textContent = originalText || "Confirm";
        const row = document.querySelector(`tr[data-request-id="${selectedRequestId}"]`);
        const currentStatusAfterFail = row?.querySelector('.status-cell .badge')?.textContent?.trim().toLowerCase() || (statusDropdown?.value || '');
        if (currentStatusAfterFail && statusDropdown) applyDisabledForCurrentStatus(currentStatusAfterFail);
        alert(`Failed to update: ${err.message}\n\nPlease try again.`);
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchForm?.submit();
      }
    });

    let searchTimeout;
    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        if (this.value.length >= 2 || this.value.length === 0) {
          searchForm?.submit();
        }
      }, 500);
    });

    document.addEventListener('keydown', function(e) {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    });

    const clearSearchLink = document.querySelector('a[href="?"]');
    if (clearSearchLink) {
      clearSearchLink.addEventListener('click', function(e) {
        e.preventDefault();
        searchInput.value = '';
        window.location.href = window.location.pathname;
      });
    }
  }

  if (filterSelect) {
    if (filterSelect.value) {
      filterSelect.style.borderColor = '#89393a';
      filterSelect.style.backgroundColor = '#f8f8f8';
    }
    filterSelect.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        this.value = '';
        this.form?.submit();
      }
    });
  }

  if (processButtons.length === 0) {
    console.warn("No .process-btn elements found on the page.");
  }

  const notifBtn = null;
  const notifDropdown = null;

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
              const showAllBtn = notifDropdown.querySelector(".show-all-btn");
              if (showAllBtn) showAllBtn.remove();
              return;
            }

            data.notifications.forEach(n => {
              const readClass = n.is_read ? "" : "unread";
              const msg = n.message || '';
              const time = n.time || '';
              let statusCls = '';
              const m = msg.toLowerCase();
              if (m.includes('approved')) statusCls = 'approved';
              else if (m.includes('processing')) statusCls = 'processing';
              else if (m.includes('completed')) statusCls = 'completed';
              else if (m.includes('rejected')) statusCls = 'rejected';
              notifList.innerHTML += `
                <div class="notif-item ${statusCls} ${readClass}">
                  <p>${msg}</p>
                  <span class="time">${time}</span>
                </div>
              `;
            });

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
          method: "POST",
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

});
