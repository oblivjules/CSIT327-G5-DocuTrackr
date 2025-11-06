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
            // Avoid shadowing the global `document` object
            const docName = button.dataset.document || '';
            const copies = button.dataset.copies || '—';
            const dateNeeded = button.dataset.dateNeeded || '—';
            const created = button.dataset.created || '—';
            const updated = button.dataset.updated || '—';
            const proofUrl = button.dataset.proofUrl;

            requestIdElement.textContent = 'REQ-' + String(requestId).padStart(4, '0');
            statusElement.textContent = status;
            statusElement.className = 'dt-status-badge ' + status.toLowerCase();
            documentElement.textContent = docName;
            copiesElement.textContent = copies;
            dateNeededElement.textContent = dateNeeded;
            createdElement.textContent = created;
            updatedElement.textContent = updated;

            // Normalize proof URL (clean unicode escapes).
            // We'll accept absolute http(s) URLs. If the value contains an encoded absolute URL
            // (e.g. "/media/https%3A/..."), try decoding and accept the decoded absolute URL.
            let imgUrl = proofUrl ? proofUrl.replace(/\\u002D/g, "-").trim() : '';
            
            if (imgUrl) {
                try {
                    imgUrl = decodeURIComponent(imgUrl);
                } catch (e) {
                    console.error("Failed to decode URL:", e);
                }
            }

             // Ensure the proof section is visible when opening the modal
            proofSection.style.display = 'block';


            // Helper to show a placeholder text inside proof section
            function showPlaceholder() {
                proofImage.removeAttribute('src');
                proofImage.style.display = 'none';

                // Create or update a small placeholder node
                let placeholder = proofSection.querySelector('.proof-not-available');
                if (!placeholder) {
                    placeholder = document.createElement('div');
                    placeholder.className = 'proof-not-available';
                    placeholder.style.color = '#666';
                    placeholder.style.fontStyle = 'italic';
                    placeholder.style.padding = '8px 0';
                    proofSection.appendChild(placeholder);
                }
                placeholder.textContent = 'Not available';
                placeholder.style.display = 'block';
            }

            function hidePlaceholder() {
                const placeholder = proofSection.querySelector('.proof-not-available');
                if (placeholder) placeholder.style.display = 'none';
            }

            if (imgUrl && imgUrl.startsWith('http')) {
                // Valid absolute URL
                proofImage.style.display = 'none';
                
                proofImage.onload = function() {
                    hidePlaceholder();
                    proofImage.style.display = 'block';
                };
                
                proofImage.onerror = function() {
                    console.error('Failed to load proof image:', imgUrl);
                    showPlaceholder();
                };

                proofImage.src = imgUrl;
            } else {
                // No valid proof URL
                console.error('Invalid proof URL (must be absolute http/https):', imgUrl);
                showPlaceholder();
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
