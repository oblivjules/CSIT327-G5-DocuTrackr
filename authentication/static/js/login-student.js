const form = document.querySelector("form");
const emailInput = document.querySelector("input[type='email']");
const passwordInput = document.querySelector("input[type='password']");
const togglePasswordIcon = document.querySelector(".password-group .hide");

// Validate email
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

// Validate password
function validatePassword() {
  const value = passwordInput.value.trim();

  if (value === "") {
    passwordInput.setCustomValidity("Password is required");
  } else {
    passwordInput.setCustomValidity("");
  }
}

// Validate only on submit click
form.addEventListener("submit", (e) => {
  validateEmail();
  validatePassword();

  if (!form.checkValidity()) {
    e.preventDefault();
    form.reportValidity(); // show tooltip
  }
});

// Clear tooltip after correction
emailInput.addEventListener("input", () => {
  emailInput.setCustomValidity("");
});

passwordInput.addEventListener("input", () => {
  passwordInput.setCustomValidity("");
});

// Toggle password visibility
togglePasswordIcon.addEventListener("click", () => {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    togglePasswordIcon.src = window.STATIC_IMAGES.show;
  } else {
    passwordInput.type = "password";
    togglePasswordIcon.src = window.STATIC_IMAGES.hide;
  }
});
