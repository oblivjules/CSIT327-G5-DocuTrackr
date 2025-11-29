document.addEventListener('DOMContentLoaded', function() {
  const proofModal = document.getElementById("proofModal");
  const proofImage = document.getElementById("proofImage");
  const proofClose = proofModal.querySelector(".close-btn");

  const proofButtons = document.querySelectorAll(".view-proof-btn");

  const processModal = document.getElementById("processModal");
  const statusDropdown = document.getElementById("statusDropdown");
  const remarks = document.getElementById("remarks");
  const confirmProcess = document.getElementById("confirmProcess");
  const cancelProcess = document.getElementById("cancelProcess");
  const closeModal = document.getElementById("closeModal");
  const requestIdField = document.getElementById("requestId");
  const remarksField = document.getElementById("remarks");

  let selectedRequestId = null;
  let confirmBound = false;

  const isValidTransition = (current, next) => {
    if (current === next) return true;
    if (current === "pending") return next === "processing" || next === "rejected";
    if (current === "processing") return next === "approved" || next === "rejected";
    if (current === "approved") return next === "completed";
    if (current === "completed") return next === "completed";
    return false;
  };

  const applyDisabledForCurrentStatus = (status) => {
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

  const applyDisabledForSelection = (validSet) => {
    const opts = ['processing','approved','rejected','completed'];
    opts.forEach(v => {
      const o = statusDropdown.querySelector(`option[value='${v}']`);
      if (o) o.disabled = !validSet.has(v);
    });
    rebuildCleanSelect();
  };

  let csContainer = null;
  let csDisplay = null;
  let csList = null;

  function mountCleanSelect() {
    if (csContainer) return;
    const field = statusDropdown.closest('.form-field');
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
    csDisplay.addEventListener('click', () => {
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
    if (!csContainer) return;
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
      });
      csList.appendChild(item);
    });
  }

  // --- VIEW PROOF ---
  proofButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      let imgUrl = btn.getAttribute("data-img-url");
      imgUrl = imgUrl.replace(/\\u002D/g, "-").trim();

      if (!imgUrl.startsWith("http")) {
        console.error("Invalid proof URL:", imgUrl);
        alert("Invalid proof URL.");
        return;
      }

      proofImage.src = imgUrl;

      proofImage.onload = () => {
        proofModal.style.display = "flex";
        document.body.style.overflow = "hidden";
      };

      proofImage.onerror = () => {
        console.error("Failed to load proof image:", imgUrl);
        alert("Unable to display image. Please check if the proof file exists.");
      };
    });
  });

  proofClose?.addEventListener("click", () => {
    proofModal.style.display = "none";
    proofImage.removeAttribute("src");
    document.body.style.overflow = "auto";
  });

  proofModal.addEventListener("click", (e) => {
    if (e.target === proofModal) {
      proofModal.style.display = "none";
      proofImage.removeAttribute("src");
      document.body.style.overflow = "auto";
    }
  });

  // ======== OPEN UPDATE MODAL ========
  const processButtons = document.querySelectorAll(".process-btn");

  processButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedRequestId = btn.dataset.requestId;
      const checked = getSelectedRequestIds();
      const idSet = new Set(checked);
      idSet.add(String(selectedRequestId));
      const ids = Array.from(idSet).filter(Boolean);
      const labelIds = ids.map(id => `REQ-${id}`);
      const maxShow = 6;
      let label = '';
      if (labelIds.length <= maxShow) {
        label = labelIds.join(', ');
      } else {
        const head = labelIds.slice(0, maxShow).join(', ');
        label = `${head} +${labelIds.length - maxShow} more`;
      }
      requestIdField.textContent = label;
      remarksField.value = "";

      const row = btn.closest("tr");
      const currentStatus = row.querySelector(".badge").textContent.trim().toLowerCase();
      statusDropdown.value = currentStatus === 'pending' ? '' : currentStatus;
      mountCleanSelect();
      rebuildCleanSelect();
      const selectedIds = getSelectedRequestIds();
      const idsForContext = new Set(selectedIds);
      idsForContext.add(String(selectedRequestId));
      const idsArr = Array.from(idsForContext).filter(Boolean);
      if (idsArr.length <= 1) {
        applyDisabledForCurrentStatus(currentStatus);
        rebuildCleanSelect();
      } else {
        let intersection = new Set(['processing','approved','rejected','completed']);
        idsArr.forEach(id => {
          const s = getRowCurrentStatus(id);
          const next = new Set(validNextStatuses(s));
          intersection = new Set([...intersection].filter(x => next.has(x)));
        });
        applyDisabledForSelection(intersection);
      }


      processModal.style.display = "flex";
      document.body.style.overflow = "hidden";

      setTimeout(() => statusDropdown.focus(), 50);
    });
  });

  // ======== CLOSE MODAL ========
  [closeModal, cancelProcess].forEach((el) =>
    el.addEventListener("click", () => {
      processModal.style.display = "none";
      document.body.style.overflow = "auto";
      selectedRequestId = null;
    })
  );

  processModal.addEventListener("click", (e) => {
    if (e.target === processModal) {
      processModal.style.display = "none";
      document.body.style.overflow = "auto";
      selectedRequestId = null;
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && processModal.style.display === "flex") {
      processModal.style.display = "none";
      document.body.style.overflow = "auto";
      selectedRequestId = null;
    }
  });

  // ======== CONFIRM STATUS UPDATE ========
  if (!confirmBound) {
    confirmBound = true;

    confirmProcess.addEventListener("click", async () => {
      if (!selectedRequestId) {
        alert("No request selected.");
        return;
      }

          const newStatus = statusDropdown.value;
          const remarks = remarksField.value.trim();

      if (!newStatus) {
        alert("Please select a status.");
        return;
      }

      const checkedIds = getSelectedRequestIds();
      const idSet = new Set(checkedIds);
      if (selectedRequestId) idSet.add(String(selectedRequestId));
      const idsToUpdate = Array.from(idSet).filter(Boolean);
      if (idsToUpdate.length === 0) {
        alert("Please select at least one request to update.");
        return;
      }

      const validIds = [];
      const invalid = [];
      idsToUpdate.forEach(id => {
        const cs = getRowCurrentStatus(id);
        if (isValidTransition(cs, newStatus)) validIds.push(id); else invalid.push({id, cs});
      });
      if (!validIds.length) {
        alert(`None of the selected requests can transition to ${newStatus.toUpperCase()}.`);
        return;
      }

      let confirmMsg;
      if (validIds.length === 1) {
        confirmMsg = `Are you sure you want to set REQ-${validIds[0]} to ${newStatus.toUpperCase()}?`;
      } else {
        confirmMsg = `Are you sure you want to set ${validIds.length} requests to ${newStatus.toUpperCase()}?`;
      }
      if (newStatus === 'approved') {
        confirmMsg += `\nThis will generate a claim slip.`;
      }
      if (invalid.length) {
        const list = invalid.slice(0,5).map(x => `REQ-${x.id} (${x.cs.toUpperCase()})`).join(', ');
        confirmMsg += `\n\n${invalid.length} selected request(s) cannot move to ${newStatus.toUpperCase()} and will be skipped` + (invalid.length>5?` (showing first 5): ${list}`:`: ${list}`);
      }
      if (!confirm(confirmMsg)) {
        return;
      }

      confirmProcess.disabled = true;
      const originalText = confirmProcess.textContent;
      confirmProcess.textContent = "Updating...";

      try {
        const res = await fetch(`/dashboard/update-status/${selectedRequestId}/`, {
          method: "POST",
          headers: {
            "X-CSRFToken": getCSRFToken(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
            remarks: remarks,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Server returned ${res.status}`);
        }

        const data = await res.json();

        if (data.success) {
          const results = [];
          results.push({ id: selectedRequestId, success: true, claim_slip: data.claim_slip });
          for (const id of validIds.filter(x => String(x) !== String(selectedRequestId))) {
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

          processModal.style.display = "none";
          document.body.style.overflow = "auto";

          const successIds = results.filter(r => r.success).map(r => `REQ-${r.id}`);
          const errorItems = results.filter(r => !r.success).map(r => `REQ-${r.id}: ${r.error}`);
          let msg = `Updated ${successIds.length} request(s) to ${newStatus.toUpperCase()} successfully.`;
          const anyClaim = results.some(r => r.success && r.claim_slip);
          if (anyClaim) msg += `\nClaim slip generated for approved requests.`;
          if (errorItems.length) msg += `\n\nFailed:\n` + errorItems.join("\n");
          alert(msg);
          selectedRequestId = null;
          window.location.reload();
        } else {
          throw new Error(data.error || "Unknown error occurred");
        }

      } catch (err) {
        console.error("Update failed:", err);
        confirmProcess.disabled = false;
        confirmProcess.textContent = "Confirm";
        const row = document.querySelector(`tr[data-request-id="${selectedRequestId}"]`);
        const currentStatusAfterFail = row?.querySelector('.status-cell .badge')?.textContent?.trim().toLowerCase() || newStatus;
        applyDisabledForCurrentStatus(currentStatusAfterFail);
        alert(`Failed to update: ${err.message}\n\nPlease try again.`);
      }
    });
  }

  function getCSRFToken() {
    let csrfToken = null;

    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') {
        csrfToken = value;
        break;
      }
    }

    if (!csrfToken) {
      const metaTag = document.querySelector('meta[name="csrf-token"]');
      if (metaTag) {
        csrfToken = metaTag.content;
      } else {
        const hiddenInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
        if (hiddenInput) {
          csrfToken = hiddenInput.value;
        }
      }
    }

    return csrfToken || '';
  }

  const selectAllCheckbox = document.getElementById('selectAll');
  const rowCheckboxes = document.querySelectorAll('.row-checkbox');
  const requestRows = document.querySelectorAll('.request-row');
  const searchInput = document.querySelector('input[name="search"]');
  const searchForm = document.querySelector('.search-form');
  const filterSelect = document.querySelector('.filter-select');

  console.log('Select All Checkbox:', selectAllCheckbox);
  console.log('Row Checkboxes found:', rowCheckboxes.length);
  console.log('Request Rows found:', requestRows.length);
  console.log('Search Input:', searchInput);
  console.log('Filter Select:', filterSelect);

  if (!selectAllCheckbox) {
    console.error('Select All checkbox not found! Make sure it has id="selectAll"');
    return;
  }

  if (rowCheckboxes.length === 0) {
    console.error('No row checkboxes found! Make sure they have class="row-checkbox"');
    return;
  }

  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchForm.submit();
      }
    });

    let searchTimeout;
    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        if (this.value.length >= 2 || this.value.length === 0) {
          searchForm.submit();
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

  selectAllCheckbox.addEventListener('change', function() {
    const isChecked = this.checked;
    console.log('Select All clicked, checked:', isChecked);

    rowCheckboxes.forEach(function(checkbox) {
      checkbox.checked = isChecked;

      const row = checkbox.closest('.request-row');
      if (isChecked) {
        row.classList.add('selected');
      } else {
        row.classList.remove('selected');
      }
    });
  });

  rowCheckboxes.forEach(function(checkbox) {
    checkbox.addEventListener('change', function() {
      const row = this.closest('.request-row');

      if (this.checked) {
        row.classList.add('selected');
      } else {
        row.classList.remove('selected');
      }

      const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
      selectAllCheckbox.checked = checkedBoxes.length === rowCheckboxes.length;
      selectAllCheckbox.indeterminate =
        checkedBoxes.length > 0 && checkedBoxes.length < rowCheckboxes.length;
    });
  });

  function getSelectedRequestIds() {
    const selectedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
    return Array.from(selectedCheckboxes)
      .map(cb => cb.closest('.request-row')?.dataset.requestId)
      .filter(Boolean);
  }

  if (filterSelect) {
    if (filterSelect.value) {
      filterSelect.style.borderColor = '#89393a';
      filterSelect.style.backgroundColor = '#f8f8f8';
    }

    filterSelect.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        this.value = '';
        this.form.submit();
      }
    });
  }

  window.getSelectedRequestIds = getSelectedRequestIds;
});
