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