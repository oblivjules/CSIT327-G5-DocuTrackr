const loginBtn = document.querySelector(".login-btn");
const emailInput = document.querySelector("input[type='email']");
const passwordInput = document.querySelector("input[type='password']");

const form = document.querySelector("form");

form.addEventListener("submit", function(e) {
  clearErrors();

  let hasError = false;
  const emailValue = emailInput.value.trim();
  const passwordValue = passwordInput.value.trim();

  if (emailValue === "") {
    showError(emailInput, "Email is required");
    hasError = true;
  } else if (!/^[a-zA-Z0-9._%+-]+@cit\.edu$/i.test(emailValue)) {
    showError(emailInput, "Please enter a valid institutional email address (e.g., name@cit.edu)");
    hasError = true;
  }

  if (passwordValue === "") {
    showError(passwordInput, "Password is required");
    hasError = true;
  }

  if (hasError) {
    e.preventDefault(); // ❌ stop form only if there are errors
  }
});

function showError(input, message) {
  const errorContainer = input.parentElement.parentElement.querySelector(".error-container");
  if (errorContainer) {
    errorContainer.innerHTML = `<img src="${window.STATIC_IMAGES.mark}" class="icon" alt="error" />${message}`;
  }
}


function clearErrors() {
  document.querySelectorAll(".error-container").forEach(container => {
    container.innerText = "";
  });
}

const togglePasswordIcon = document.querySelector(".password-group .hide");
togglePasswordIcon.addEventListener("click", () => {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    togglePasswordIcon.src = window.STATIC_IMAGES.show;
  } else {
    passwordInput.type = "password";
    togglePasswordIcon.src = window.STATIC_IMAGES.hide;
  }
});


