// Student Requests List page JS - proof modal handling

document.addEventListener('DOMContentLoaded', () => {
  const proofModal = document.getElementById('proofModal');
  const proofImage = document.getElementById('proofImage');
  const closeBtn = document.querySelector('#proofModal .close-btn');

  function openModal(imgUrl) {
    if (!imgUrl) return;
    proofImage.src = imgUrl;
    proofModal.style.display = 'block';
  }

  function closeModal() {
    proofModal.style.display = 'none';
    proofImage.src = '';
  }

  document.querySelectorAll('.view-proof-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const imgUrl = btn.getAttribute('data-img-url');
      openModal(imgUrl);
    });
  });

  closeBtn?.addEventListener('click', closeModal);

  window.addEventListener('click', (event) => {
    if (event.target === proofModal) {
      closeModal();
    }
  });
});