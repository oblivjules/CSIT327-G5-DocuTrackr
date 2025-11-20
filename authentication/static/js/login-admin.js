const form = document.querySelector("#admin-login-form");
const emailInput = form.querySelector("input[name='email']");
const passwordInput = form.querySelector("input[name='password']");
const togglePasswordIcon = form.querySelector(".password-group .hide");

function validateEmail() {
  const value = emailInput.value.trim();
  if (value === "") {
    emailInput.setCustomValidity("Email is required");
  } else if (!/^[a-zA-Z0-9._%+-]+@cit\.edu$/i.test(value)) {
    emailInput.setCustomValidity("Please enter a valid institutional email address (e.g., name@cit.edu)");
  } else {
    emailInput.setCustomValidity("");
  }
}

function validatePassword() {
  const value = passwordInput.value.trim();
  if (value === "") {
    passwordInput.setCustomValidity("Password is required");
  } else {
    passwordInput.setCustomValidity("");
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  validateEmail();
  if (!emailInput.checkValidity()) {
    emailInput.reportValidity();
    return;
  }

  validatePassword();
  if (!passwordInput.checkValidity()) {
    passwordInput.reportValidity();
    return;
  }

  form.submit();
});

emailInput.addEventListener("input", () => {
  validateEmail();
  emailInput.setCustomValidity("");
});

passwordInput.addEventListener("input", () => {
  validatePassword();
  passwordInput.setCustomValidity("");
});

togglePasswordIcon.addEventListener("click", () => {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    togglePasswordIcon.src = window.STATIC_IMAGES.show;
  } else {
    passwordInput.type = "password";
    togglePasswordIcon.src = window.STATIC_IMAGES.hide;
  }
});
