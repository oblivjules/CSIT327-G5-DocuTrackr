document.addEventListener('DOMContentLoaded', function() {
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

    // Process Request Modal Functionality
    const processModal = document.getElementById('processModal');
    const processButtons = document.querySelectorAll('.process-btn');
    const cancelProcessBtn = document.getElementById('cancelProcess');
    const confirmProcessBtn = document.getElementById('confirmProcess');
    const modalClose = document.querySelector('.modal-close');
    const requestIdSpan = document.getElementById('requestId');
    
    let currentRequestId = null;

    // Open modal when process button is clicked
    processButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            currentRequestId = this.dataset.requestId;
            requestIdSpan.textContent = `#${currentRequestId}`;
            processModal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
    });

    // Close modal functions
    function closeModal() {
        processModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        currentRequestId = null;
    }

    // Close modal event listeners
    cancelProcessBtn.addEventListener('click', closeModal);
    modalClose.addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    processModal.addEventListener('click', function(e) {
        if (e.target === processModal) {
            closeModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && processModal.style.display === 'block') {
            closeModal();
        }
    });

    // Handle process confirmation
    confirmProcessBtn.addEventListener('click', function() {
        if (!currentRequestId) return;

        // Disable button and show loading state
        this.disabled = true;
        this.innerHTML = '<span>Processing...</span>';

        // Make AJAX request to process the request
        fetch(`/dashboard/process-request/${currentRequestId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Show success message
                showNotification('Request processed successfully!', 'success');
                
                closeModal();
                
                // Immediately refresh the page to show updated status
                window.location.reload();
            } else {
                showNotification(data.error || 'Failed to process request', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('An error occurred while processing the request', 'error');
        })
        .finally(() => {
            // Re-enable button
            this.disabled = false;
            this.innerHTML = 'Yes';
        });
    });

    // Utility function to get CSRF token
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Utility function to show notifications
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
        
        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        });
    }
});
