// Elements
const passwordForm = document.getElementById("passwordForm");

function getCSRFToken() {
  let csrfToken = null;
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrftoken') { csrfToken = value; break; }
  }
  return csrfToken || '';
}

if (passwordForm) {
  passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const oldPass = document.getElementById("oldPassword").value;
    const newPass = document.getElementById("newPassword").value;
    const confirmPass = document.getElementById("confirmPassword").value;

    if (!oldPass || !newPass || !confirmPass) {
      alert("Please fill in all fields.");
      return;
    }
    const lenOk = newPass.length >= 8;
    const upperOk = /[A-Z]/.test(newPass);
    const numOk = /[0-9]/.test(newPass);
    const specialOk = /[^A-Za-z0-9]/.test(newPass);
    if (!lenOk || !upperOk || !numOk || !specialOk) {
      alert("Password must be 8+ chars, include an uppercase letter, a number, and at least one special character.");
      return;
    }
    if (newPass !== confirmPass) {
      alert("New passwords do not match!");
      return;
    }
    try {
      const formData = new URLSearchParams();
      formData.append('old_password', oldPass);
      formData.append('new_password', newPass);
      formData.append('confirm_password', confirmPass);
      const res = await fetch('/change-password/', {
        method: 'POST',
        headers: { 'X-CSRFToken': getCSRFToken(), 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });
      let data = {};
      try { data = await res.json(); } catch {}
      if (!res.ok || !data.success) {
        alert((data && data.error) || `Failed to change password (status ${res.status})`);
        return;
      }
      alert('Password changed successfully!');
      passwordForm.reset();
    } catch (err) {
      alert('Network error. Please try again.');
    }
  });
}

const changePasswordHeader = document.getElementById('changePasswordHeader') || document.querySelector('.edit-btn[data-section="password"]');
const savePasswordHeader = document.getElementById('savePasswordHeader');
const cancelPasswordHeader = document.getElementById('cancelPasswordHeader');
const headerSaveCancel = document.getElementById('saveCancelHeader');
const passwordValueEl = document.querySelector('.password-value');

function showPasswordForm() {
  if (passwordValueEl) passwordValueEl.style.display = 'none';
  if (passwordForm) passwordForm.style.display = 'block';
  if (changePasswordHeader) changePasswordHeader.style.display = 'none';
  if (headerSaveCancel) headerSaveCancel.style.display = 'flex';
}

function hidePasswordForm() {
  if (passwordForm) {
    passwordForm.reset();
    passwordForm.style.display = 'none';
  }
  if (passwordValueEl) passwordValueEl.style.display = 'block';
  if (headerSaveCancel) headerSaveCancel.style.display = 'none';
  if (changePasswordHeader) changePasswordHeader.style.display = 'inline-block';
}

if (changePasswordHeader) {
  changePasswordHeader.addEventListener('click', showPasswordForm);
}
if (cancelPasswordHeader) {
  cancelPasswordHeader.addEventListener('click', hidePasswordForm);
}
if (savePasswordHeader) {
  savePasswordHeader.addEventListener('click', () => {
    if (passwordForm && passwordForm.reportValidity) {
      passwordForm.requestSubmit ? passwordForm.requestSubmit() : passwordForm.dispatchEvent(new Event('submit'));
    }
  });
}

document.querySelectorAll(".toggle-password").forEach(button => {
  button.addEventListener("click", () => {
    const targetId = button.getAttribute("data-target");
    const input = document.getElementById(targetId);
    if (!input) return;
    if (input.type === "password") {
      input.type = "text";
      button.textContent = "Hide"; 
    } else {
      input.type = "password";
      button.textContent = "Show"; 
    }
  });
});

// legacy inline cancel (if present)
const cancelPasswordBtn = document.getElementById('cancelPassword');
if (cancelPasswordBtn) {
  cancelPasswordBtn.addEventListener('click', hidePasswordForm);
}

const reqLength = document.getElementById('req-length');
const reqUpper = document.getElementById('req-uppercase');
const reqNumber = document.getElementById('req-number');
const reqSpecial = document.getElementById('req-special');
const newPasswordInput = document.getElementById('newPassword');
function setReq(el, ok) {
  if (!el) return;
  el.classList.toggle('valid', ok);
  el.classList.toggle('invalid', !ok);
}
if (newPasswordInput) {
  const updateReqs = () => {
    const val = newPasswordInput.value || '';
    setReq(reqLength, val.length >= 8);
    setReq(reqUpper, /[A-Z]/.test(val));
    setReq(reqNumber, /[0-9]/.test(val));
    setReq(reqSpecial, /[^A-Za-z0-9]/.test(val));
  };
  newPasswordInput.addEventListener('input', updateReqs);
  updateReqs();
}

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