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

 // --- VIEW PROOF ---
  proofButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      let imgUrl = btn.getAttribute("data-img-url");

      // Remove any leftover unicode escapes
      imgUrl = imgUrl.replace(/\\u002D/g, "-").trim();

      if (!imgUrl.startsWith("http")) {
        console.error("Invalid proof URL:", imgUrl);
        alert("Invalid proof URL.");
        return;
      }

      proofImage.src = imgUrl;

      proofImage.onload = () => {
        console.log("✅ Modal should open now");
        proofModal.style.display = "flex";
        document.body.style.overflow = "hidden";
      }
      
      console.log("Loaded proof image:", proofImage.src);

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
      requestIdField.textContent = `REQ-${selectedRequestId}`;
      remarksField.value = "";
      statusDropdown.value = "processing";
      processModal.style.display = "flex";
      document.body.style.overflow = "hidden";
      // Focus the first interactive field for accessibility
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

  // Close when clicking on the overlay background
  processModal.addEventListener("click", (e) => {
    if (e.target === processModal) {
      processModal.style.display = "none";
      document.body.style.overflow = "auto";
      selectedRequestId = null;
    }
  });

  // Close on ESC key for better UX
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

    // Validate status selection
  if (!newStatus) {
    alert("Please select a status.");
    return;
  }
    // Optional: Confirm destructive actions
    if (newStatus === 'rejected') {
    if (!confirm(`Are you sure you want to reject this request?`)) {
      return;
    }
  }
 
  // Disable button to prevent double-clicks
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

     // Handle non-OK responses
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${res.status}`);
      }

    const data = await res.json();
    
    if (data.success) {
      processModal.style.display = "none";
      document.body.style.overflow = "auto";

        // Update UI instantly
        const row = document.querySelector(`tr[data-request-id="${selectedRequestId}"]`);
        if (row) {
        const statusCell = row.querySelector('.status-cell .badge');
        if (statusCell) {
          statusCell.textContent = newStatus.toUpperCase();
          // Remove all status classes and add new one
          statusCell.className = 'badge';
          statusCell.classList.add(newStatus);
        }

       // ✅ Build success message
      let successMessage = `Request updated to ${newStatus.toUpperCase()} successfully!`;
      if (data.claim_slip) {
        successMessage += `\n\nClaim slip generated: ${data.claim_slip}`;
      }

      // ✅ Show ONE alert, then reload
      alert(successMessage);
      // ✅ Clear selected request
      selectedRequestId = null;
      // ✅ Reload immediately after alert is dismissed
      window.location.reload();
      } else {
        throw new Error(data.error || "Unknown error occurred");
      }
    }
    } catch (err) {
      console.error("Update failed:", err);
      // ✅ Re-enable button on error
      confirmProcess.disabled = false;
      confirmProcess.textContent = "Confirm";
      // ✅ Show error alert (but DON'T reload)
    alert(`Failed to update: ${err.message}\n\nPlease try again.`);
    }
  });
  }

  function getCSRFToken() {
    let csrfToken = null;
  
  // Try to get from cookie
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrftoken') {
      csrfToken = value;
      break;
    }
  }

  // Fallback: get from meta tag or hidden input
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
            selectAllCheckbox.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < rowCheckboxes.length;
        });
    });

    function getSelectedRequestIds() {
        const selectedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
        return Array.from(selectedCheckboxes).map(checkbox => checkbox.dataset.requestId);
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