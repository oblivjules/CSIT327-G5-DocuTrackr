const dateInput = document.getElementById('dateNeeded');
const today = new Date().toISOString().split('T')[0];
dateInput.setAttribute('min', today);

const form = document.querySelector('form');
const fileInput = document.getElementById('fileInput');
const fileLabel = document.querySelector('.file-label');
const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];

let errorContainer = document.querySelector('.file-upload .form-error');
if (!errorContainer) {
    errorContainer = document.createElement('p');
    errorContainer.className = 'form-error';
    errorContainer.style.color = 'red';
    errorContainer.style.fontWeight = 'bold';
    fileInput.parentNode.appendChild(errorContainer);
}

fileInput.addEventListener('change', () => {
    errorContainer.textContent = '';
    const file = fileInput.files[0];

    if (!file) {
        errorContainer.textContent = 'Proof of payment is required.';
        return;
    }

    if (!allowedTypes.includes(file.type)) {
        errorContainer.textContent = 'Unsupported file format. Supported formats: PNG, JPG, SVG, WEBP.';
        fileInput.value = '';
        fileLabel.textContent = 'Choose File';
        return;
    }

    fileLabel.textContent = file.name;
});

form.addEventListener('submit', (e) => {
    const file = fileInput.files[0];

    if (!file) {
        e.preventDefault();
        errorContainer.textContent = 'Proof of payment is required.';
        return false;
    }

    if (!allowedTypes.includes(file.type)) {
        e.preventDefault();
        errorContainer.textContent = 'Unsupported file format. Supported formats: PNG, JPG, SVG, WEBP.';
        return false;
    }
});
