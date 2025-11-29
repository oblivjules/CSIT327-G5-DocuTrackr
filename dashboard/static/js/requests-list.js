document.addEventListener('DOMContentLoaded', function() {
  const searchForm = document.querySelector('.search-form');
  const searchInput = document.querySelector('input[name="search"]');
  const selectAllCheckbox = document.getElementById('selectAll');
  const rowCheckboxes = document.querySelectorAll('.row-checkbox');

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
