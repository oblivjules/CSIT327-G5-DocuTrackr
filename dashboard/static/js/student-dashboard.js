// Student Dashboard - Modal for viewing request details
// This script handles opening/closing the modal and filling it with data

// Wait for the page to load completely
document.addEventListener('DOMContentLoaded', function() {
    // Get the modal element
    const modal = document.getElementById('requestModal');
    
    // If modal doesn't exist, stop here
    if (!modal) {
        return;
    }

    // Get all the elements we need to fill with data
    const closeButton = modal.querySelector('.dt-close');
    const requestIdElement = document.getElementById('mRequestId');
    const statusElement = document.getElementById('mStatus');
    const documentElement = document.getElementById('mDocument');
    const copiesElement = document.getElementById('mCopies');
    const dateNeededElement = document.getElementById('mDateNeeded');
    const createdElement = document.getElementById('mCreated');
    const updatedElement = document.getElementById('mUpdated');
    const proofSection = document.getElementById('mProofSection');
    const proofImage = document.getElementById('mProofImage');

    // Function to open the modal
    function openModal() {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
    }

    // Function to close the modal
    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Allow scrolling again
    }

    // Find all "View Details" buttons and add click listeners
    const viewDetailsButtons = document.querySelectorAll('.view-details-btn');
    
    viewDetailsButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            // Get data from the button's data attributes
            const requestId = button.dataset.requestId || '';
            const status = button.dataset.status || '';
            const document = button.dataset.document || '';
            const copies = button.dataset.copies || '—';
            const dateNeeded = button.dataset.dateNeeded || '—';
            const created = button.dataset.created || '—';
            const updated = button.dataset.updated || '—';
            const proofUrl = button.dataset.proofUrl;

            // Fill the modal with the data
            requestIdElement.textContent = 'REQ-' + String(requestId).padStart(5, '0');
            statusElement.textContent = status;
            statusElement.className = 'dt-status-badge ' + status.toLowerCase();
            documentElement.textContent = document;
            copiesElement.textContent = copies;
            dateNeededElement.textContent = dateNeeded;
            createdElement.textContent = created;
            updatedElement.textContent = updated;

            // Handle proof of payment image
            if (proofUrl) {
                // Make sure the URL starts with /
                const imageUrl = proofUrl.startsWith('/') ? proofUrl : '/' + proofUrl;
                proofImage.src = imageUrl;
                proofSection.style.display = 'block';
            } else {
                // No proof image, hide the section
                proofImage.removeAttribute('src');
                proofSection.style.display = 'none';
            }

            // Open the modal
            openModal();
        });
    });

    // Close modal when X button is clicked
    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }

    // Close modal when clicking outside the modal content
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
});