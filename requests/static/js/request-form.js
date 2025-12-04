console.log("🔥 JS Loaded Successfully!");

const dateInput = document.getElementById('dateNeeded');
if (dateInput) {
  const today = new Date().toISOString().split('T')[0];
  dateInput.setAttribute('min', today);
}

const form = document.querySelector('form');
const fileInput = document.getElementById('fileInput');
const fileLabel = document.querySelector('.file-label');
const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];

let errorContainer = document.querySelector('.file-upload .form-error');
if (!errorContainer && fileInput) {
  errorContainer = document.createElement('p');
  errorContainer.className = 'form-error';
  errorContainer.style.color = 'red';
  errorContainer.style.fontWeight = 'bold';
  fileInput.parentNode.appendChild(errorContainer);
}

if (fileInput) {
  fileInput.addEventListener('change', () => {
    errorContainer.textContent = '';
    const file = fileInput.files[0];

    if (!file) {
      errorContainer.textContent = 'Proof of payment is required.';
      fileLabel.textContent = 'Choose File';
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      errorContainer.textContent = 'Unsupported file format. Supported: PNG, JPG, SVG, WEBP.';
      fileInput.value = '';
      fileLabel.textContent = 'Choose File';
      return;
    }

    fileLabel.textContent = file.name;
  });
}

if (form) {
  form.addEventListener('submit', (e) => {
    const file = fileInput?.files[0];
    errorContainer.textContent = '';

    if (!file) {
      e.preventDefault();
      errorContainer.textContent = 'Proof of payment is required.';
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      e.preventDefault();
      errorContainer.textContent = 'Unsupported file format. Supported: PNG, JPG, SVG, WEBP.';
      return false;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Modal script loaded");

  const modal = document.getElementById("proofModal");
  const modalImg = document.getElementById("proofImage");
  const closeBtn = document.querySelector(".close-btn");

  if (!modal || !modalImg) {
    console.warn("⚠️ Modal elements not found in DOM.");
    return;
  }

  const proofButtons = document.querySelectorAll(".view-proof-btn");
  console.log(`🟡 Found ${proofButtons.length} proof button(s)`);

  proofButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      let imgUrl = btn.getAttribute("data-img-url");

      if (!imgUrl) {
        console.warn("⚠️ Missing data-img-url for proof button");
        return;
      }

      if (!imgUrl.startsWith("/")) imgUrl = "/" + imgUrl;
      modalImg.src = imgUrl;

      modalImg.onload = () => {
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
        console.log("🖼️ Proof loaded:", imgUrl);
      };

      modalImg.onerror = () => {
        console.error("❌ Failed to load proof image:", imgUrl);
        alert("Unable to display image. Please check if the proof file exists.");
      };
    });
  });

  closeBtn?.addEventListener("click", () => {
    modal.style.display = "none";
    modalImg.src = "";
    document.body.style.overflow = "auto";
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
      modalImg.src = "";
      document.body.style.overflow = "auto";
    }
  });
});

