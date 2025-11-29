document.addEventListener('DOMContentLoaded', function() {
    // Sync Recent Activity card height to Recent Document Requests card
    function syncActivityHeight() {
        const recent = document.querySelector('.dashboard-row.two-up .recent-requests');
        const activity = document.querySelector('.dashboard-row.two-up .activity-section');
        if (!recent || !activity) return;
        // Measure the actual card height including header and footer
        const height = recent.offsetHeight;
        if (height && Math.abs(activity.offsetHeight - height) > 2) {
            activity.style.height = height + 'px';
        }
    }

    // Initial sync after layout
    requestAnimationFrame(syncActivityHeight);
    // Re-sync on window resize (debounced)
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(syncActivityHeight, 100);
    });
  
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
            const docName = button.dataset.document || '';
            const copies = button.dataset.copies || '—';
            const dateNeeded = button.dataset.dateNeeded || '—';
            const created = button.dataset.created || '—';
            const updated = button.dataset.updated || '—';
            const proofUrl = button.dataset.proofUrl;

            requestIdElement.textContent = `REQ-${requestId}`;
            statusElement.textContent = status;
            statusElement.className = 'dt-status-badge ' + status.toLowerCase();
            documentElement.textContent = docName;
            copiesElement.textContent = copies;
            dateNeededElement.textContent = dateNeeded;
            createdElement.textContent = created;
            updatedElement.textContent = updated;

            let imgUrl = proofUrl ? proofUrl.replace(/\\u002D/g, "-").trim() : '';
            
            if (imgUrl) {
                try {
                    imgUrl = decodeURIComponent(imgUrl);
                } catch (e) {
                    console.error("Failed to decode URL:", e);
                }
            }

            proofSection.style.display = 'block';

            function showPlaceholder() {
                proofImage.removeAttribute('src');
                proofImage.style.display = 'none';
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

            if (imgUrl) {
                if (imgUrl.startsWith('/media/http')) {
                    imgUrl = imgUrl.replace(/^\/media\//, '');
                } else if (imgUrl.startsWith('http')) {
                } else if (imgUrl.startsWith('/')) {
                } else {
                    imgUrl = '/media/' + imgUrl;
                }
            }

            if (imgUrl) {
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

    const notifBtn = document.getElementById("notifBtn");
    const notifDropdown = document.getElementById("notifDropdown");

    notifBtn.addEventListener("click", () => {
    notifDropdown.style.display =
        notifDropdown.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", (e) => {
    if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
        notifDropdown.style.display = "none";
    }
    });
});
