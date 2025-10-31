document.addEventListener('DOMContentLoaded', function() {
  
    const modal = document.getElementById('requestModal');
    
    if (!modal) {
        return;
    }
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

    function openModal() {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    const viewDetailsButtons = document.querySelectorAll('.view-details-btn');
    
    viewDetailsButtons.forEach(function(button) {
        button.addEventListener('click', function() {

            const requestId = button.dataset.requestId || '';
            const status = button.dataset.status || '';
            const document = button.dataset.document || '';
            const copies = button.dataset.copies || '—';
            const dateNeeded = button.dataset.dateNeeded || '—';
            const created = button.dataset.created || '—';
            const updated = button.dataset.updated || '—';
            const proofUrl = button.dataset.proofUrl;

            requestIdElement.textContent = 'REQ-' + String(requestId).padStart(5, '0');
            statusElement.textContent = status;
            statusElement.className = 'dt-status-badge ' + status.toLowerCase();
            documentElement.textContent = document;
            copiesElement.textContent = copies;
            dateNeededElement.textContent = dateNeeded;
            createdElement.textContent = created;
            updatedElement.textContent = updated;

            if (proofUrl) {
                const imageUrl = proofUrl.startsWith('/') ? proofUrl : '/' + proofUrl;
                proofImage.src = imageUrl;
                proofSection.style.display = 'block';
            } else {
                proofImage.removeAttribute('src');
                proofSection.style.display = 'none';
            }

            openModal();
        });
    });

    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
});
