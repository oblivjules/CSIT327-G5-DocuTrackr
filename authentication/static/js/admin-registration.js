document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("adminForm");

  const fields = {
    firstname: document.getElementById("firstname"),
    lastname: document.getElementById("lastname"),
    adminId: document.getElementById("adminId"),
    email: document.getElementById("email"),
    password: document.getElementById("password"),
    confirmPassword: document.getElementById("confirm_password")
  };

  const toggleIcons = document.querySelectorAll(".password-group .hide");
  toggleIcons.forEach(icon => {
    icon.addEventListener("click", () => {
      const input = icon.parentElement.querySelector(".input-field");
      if (input.type === "password") {
        input.type = "text";
        icon.src = window.STATIC_IMAGES.show;
      } else {
        input.type = "password";
        icon.src = window.STATIC_IMAGES.hide;
      }
    });
  });

  // Validation functions
  function validateNames() {
    if (fields.firstname.value.trim() === "") {
      fields.firstname.setCustomValidity("First name is required");
    } else {
      fields.firstname.setCustomValidity("");
    }

    if (fields.lastname.value.trim() === "") {
      fields.lastname.setCustomValidity("Last name is required");
    } else {
      fields.lastname.setCustomValidity("");
    }
  }

  function validateAdminId() {
    const value = fields.adminId.value.trim();
    if (value === "") {
      fields.adminId.setCustomValidity("Admin ID is required");
    } else if (!/^\d{4}$/.test(value)) { // exactly 4 digits
      fields.adminId.setCustomValidity("Admin ID must be exactly 4 digits");
    } else {
      fields.adminId.setCustomValidity("");
    }
  }

  function validateEmail() {
    const value = fields.email.value.trim();
    if (value === "") {
      fields.email.setCustomValidity("Email is required");
    } else if (!value.endsWith("@cit.edu")) {
      fields.email.setCustomValidity("Please enter a valid institutional email address (e.g., name@cit.edu)");
    } else {
      fields.email.setCustomValidity("");
    }
  }

  function validatePassword() {
    const value = fields.password.value.trim();
    fields.password.setCustomValidity("");

    if (value === "") {
      fields.password.setCustomValidity("Password is required");
      return;
    }

    // Common password rules
    const rules = [
      { regex: /.{8,}/, message: "at least 8 characters" },
      { regex: /[A-Z]/, message: "at least one uppercase letter" },
      { regex: /[a-z]/, message: "at least one lowercase letter" },
      { regex: /\d/, message: "at least one number" },
      { regex: /[!@#$%^&*()_,.?":{}|<>]/, message: "at least one special character" }
    ];

    const failed = rules.filter(r => !r.regex.test(value)).map(r => r.message);
    if (failed.length > 0) {
      fields.password.setCustomValidity("Password must contain: " + failed.join(", "));
    }
  }

  function validateConfirmPassword() {
    fields.confirmPassword.setCustomValidity("");
    if (fields.confirmPassword.value.trim() === "") {
      fields.confirmPassword.setCustomValidity("Please confirm your password");
    } else if (fields.confirmPassword.value !== fields.password.value) {
      fields.confirmPassword.setCustomValidity("Passwords do not match");
    }
  }

  // Submit
  form.addEventListener("submit", (e) => {
    validateNames();
    validateAdminId();
    validateEmail();
    validatePassword();
    validateConfirmPassword();

    if (!form.checkValidity()) {
      e.preventDefault();
      form.reportValidity(); // show tooltip on first invalid field
    }
  });

  // Clear tooltip on input
  Object.values(fields).forEach(field => {
    field.addEventListener("input", () => field.setCustomValidity(""));
  });
});
