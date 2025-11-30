document.addEventListener('DOMContentLoaded', function() {
  const searchForm = document.querySelector('.search-form');
  const searchInput = document.querySelector('input[name="search"]');
  const selectAllCheckbox = document.getElementById('selectAll');
  const rowCheckboxes = document.querySelectorAll('.row-checkbox');
  const requestModal = document.getElementById("requestModal"); // detailed request modal

  if (requestModal) {
    const requestCloseBtn = requestModal.querySelector(".dt-close");

    // modal elements (IDs expected in template)
    const mRequestId = document.getElementById("mRequestId");
    const mStatus = document.getElementById("mStatus");
    const mDocument = document.getElementById("mDocument");
    const mCopies = document.getElementById("mCopies");
    const mDateNeeded = document.getElementById("mDateNeeded");
    const mCreated = document.getElementById("mCreated");
    const mUpdated = document.getElementById("mUpdated");
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
      console.log('requests-list.js: openRequestModal called');
      console.log('requests-list.js: Modal element exists?', !!requestModal);
      if (requestModal) {
        console.log('requests-list.js: Current inline display:', requestModal.style.display);
        console.log('requests-list.js: Current computed display:', window.getComputedStyle(requestModal).display);
        console.log('requests-list.js: Modal in DOM?', document.body.contains(requestModal));
        
        // Remove the inline display:none style
        if (requestModal.style.display === 'none' || requestModal.getAttribute('style')?.includes('display:none')) {
          requestModal.style.display = '';
        }
        
        // Set display to flex
        requestModal.style.display = "flex";
        document.body.style.overflow = "hidden";
        
        // Force a reflow
        void requestModal.offsetHeight;
        
        console.log('requests-list.js: After setting - inline display:', requestModal.style.display);
        console.log('requests-list.js: After setting - computed display:', window.getComputedStyle(requestModal).display);
        console.log('requests-list.js: Modal offsetParent:', requestModal.offsetParent);
        console.log('requests-list.js: Modal getBoundingClientRect:', requestModal.getBoundingClientRect());
      }
    }

    function closeRequestModal() {
      requestModal.style.display = "none";
      document.body.style.overflow = "auto";
      if (mProofImage) mProofImage.removeAttribute('src');
    }

    const detailsButtons = document.querySelectorAll('.view-details-btn');
    console.log('requests-list.js: Found', detailsButtons.length, 'view-details buttons');
    
    if (detailsButtons.length > 0 && requestModal) {
      detailsButtons.forEach(button => {
        // Mark button as handled by requests-list.js to prevent admin-dashboard.js from also handling it
        button.setAttribute('data-handled-by-requests-list', 'true');
        
        button.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('requests-list.js: View details button clicked');
          
          // read values from data attributes on the button
          const requestId = button.dataset.requestId || '';
          const status = button.dataset.status || '';
          const docName = button.dataset.document || '';
          const copies = button.dataset.copies || '—';
          const dateNeeded = button.dataset.dateNeeded || '—';
          const created = button.dataset.created || '—';
          const updated = button.dataset.updated || '—';
          let proofUrl = button.dataset.proofUrl || '';

          console.log('requests-list.js: Opening modal for REQ-', requestId);

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

          // normalize proof URL (handles encoded slashes and django media prefix)
          let imgUrl = proofUrl ? proofUrl.replace(/\\u002D/g, "-").trim() : '';
          if (imgUrl) {
            try { imgUrl = decodeURIComponent(imgUrl); } catch (e) { /* ignore decode errors */ }
          }

          // show proof section (we keep it visible even if no proof so placeholder shows)
          if (mProofSection) mProofSection.style.display = 'block';

          if (imgUrl) {
            // fix common path problems
            if (imgUrl.startsWith('/media/http')) {
              imgUrl = imgUrl.replace(/^\/media\//, '');
            } else if (!imgUrl.startsWith('http') && !imgUrl.startsWith('/')) {
              imgUrl = '/media/' + imgUrl;
            }

            // hide image until loaded
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
          console.log('requests-list.js: Modal should be open now');
        });
      });
    } else {
      console.warn('requests-list.js: No view-details buttons or modal found');
    }

    requestCloseBtn?.addEventListener('click', closeRequestModal);

    requestModal.addEventListener('click', (e) => {
      if (e.target === requestModal) closeRequestModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && requestModal.style.display === 'flex') closeRequestModal();
    });
  } // end requestModal logic
  
  if (searchForm && searchInput) {
    // Submit on Enter
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchForm.submit();
      }
    });

    // Debounced auto-submit for quick filtering
    let searchTimeout;
    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        if (this.value.length >= 2 || this.value.length === 0) {
          searchForm.submit();
        }
      }, 500);
    });

    // Ctrl+F focuses the search input for faster navigation
    document.addEventListener('keydown', function(e) {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    });

    // Clear search link behavior
    const clearSearchLink = document.querySelector('.table-footer a[href="?"]');
    if (clearSearchLink) {
      clearSearchLink.addEventListener('click', function(e) {
        e.preventDefault();
        searchInput.value = '';
        window.location.href = window.location.pathname;
      });
    }
  }

  // ===== Checkbox selection (mirror Admin Dashboard) =====
  if (selectAllCheckbox && rowCheckboxes.length) {
    selectAllCheckbox.addEventListener('change', function() {
      const isChecked = this.checked;
      rowCheckboxes.forEach(function(checkbox) {
        checkbox.checked = isChecked;
        const row = checkbox.closest('.request-row');
        if (row) {
          row.classList.toggle('selected', isChecked);
        }
      });
      // Clear indeterminate when explicitly toggled
      selectAllCheckbox.indeterminate = false;
    });

    rowCheckboxes.forEach(function(checkbox) {
      checkbox.addEventListener('change', function() {
        const row = this.closest('.request-row');
        if (row) {
          row.classList.toggle('selected', this.checked);
        }
        const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
        selectAllCheckbox.checked = checkedBoxes.length === rowCheckboxes.length;
        selectAllCheckbox.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < rowCheckboxes.length;
      });
    });

    // Expose helper like Admin Dashboard (return row data-request-id)
    window.getSelectedRequestIds = function() {
      const selectedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
      return Array.from(selectedCheckboxes)
        .map(cb => cb.closest('.request-row')?.dataset.requestId)
        .filter(Boolean);
    };
  }

});
