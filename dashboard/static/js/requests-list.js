document.addEventListener('DOMContentLoaded', function() {
  const searchForm = document.querySelector('.search-form');
  const searchInput = document.querySelector('input[name="search"]');
  const requestModal = document.getElementById("requestModal");
  const processModal = document.getElementById("processModal");
  if (requestModal) {
    const requestCloseBtn = requestModal.querySelector(".dt-close");
    const mRequestId = document.getElementById("mRequestId");
    const mStatus = document.getElementById("mStatus");
    const mDocument = document.getElementById("mDocument");
    const mCopies = document.getElementById("mCopies");
    const mDateNeeded = document.getElementById("mDateNeeded");
    const mCreated = document.getElementById("mCreated");
    const mUpdated = document.getElementById("mUpdated");
    const mProofSection = document.getElementById("mProofSection");
    const mProofImage = document.getElementById("mProofImage");
    const mRemarks = document.getElementById("mRemarks");

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
      const sw = window.innerWidth - document.documentElement.clientWidth;
      if (processModal) processModal.style.display = "none";
      if (requestModal.parentNode !== document.body) {
        document.body.appendChild(requestModal);
      }
      requestModal.style.display = "flex";
      requestModal.style.visibility = "visible";
      requestModal.style.opacity = "1";
      requestModal.style.pointerEvents = "auto";
      requestModal.style.position = "fixed";
      requestModal.style.top = "0";
      requestModal.style.left = "0";
      requestModal.style.width = "100%";
      requestModal.style.height = "100%";
      requestModal.style.zIndex = "5000";
      requestModal.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      document.body.style.overflow = "hidden";
      if (sw > 0) document.body.style.paddingRight = sw + "px";
    }

    function closeRequestModal() {
      requestModal.style.display = "none";
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = "";
      if (mProofImage) mProofImage.removeAttribute('src');
    }

    const detailsButtons = document.querySelectorAll('.view-details-btn');
    console.log("FOUND DETAILS BUTTONS:", detailsButtons.length);

    detailsButtons.forEach(button => {
      button.setAttribute('data-handled-by-requests-list', 'true');
      button.addEventListener('click', (e) => {
        console.log("View Details clicked:", button.dataset.requestId);
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
          mStatus.className = 'dt-status-badge ' + (status || '').toLowerCase();
        }
        if (mDocument) mDocument.textContent = docName;
        if (mCopies) mCopies.textContent = copies;
        if (mDateNeeded) mDateNeeded.textContent = dateNeeded;
        if (mCreated) mCreated.textContent = created;
        if (mUpdated) mUpdated.textContent = updated;
        if (mRemarks) mRemarks.textContent = remarks;

        let imgUrl = proofUrl ? proofUrl.replace(/\u002D/g, "-").trim() : '';
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
    requestModal.addEventListener('click', (e) => { if (e.target === requestModal) closeRequestModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && requestModal.style.display === 'flex') closeRequestModal(); });
  }
  
  if (searchForm && searchInput) {
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

    const clearSearchLink = document.querySelector('.table-footer a[href="?"]');
    if (clearSearchLink) {
      clearSearchLink.addEventListener('click', function(e) {
        e.preventDefault();
        searchInput.value = '';
        window.location.href = window.location.pathname;
      });
    }
  }
});
