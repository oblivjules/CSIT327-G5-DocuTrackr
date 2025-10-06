document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("studentForm");

  const validateEmail = (email) => email.endsWith("@cit.edu");
  const validateStudentId = (id) => /^(?:\d{4}-\d{5}|\d{2}-\d{4}-\d{3})$/.test(id);
  
  const fields = {
    firstname: document.getElementById("firstname"),
    lastname: document.getElementById("lastname"),
    studentId: document.getElementById("studentId"),
    email: document.getElementById("email"),
    password: document.getElementById("password"),
    confirmPassword: document.getElementById("confirm_password")
  };

  // Initialize toggle icons with static paths
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

  fields.firstname.addEventListener("input", () => {
    fields.firstname.setCustomValidity(
      fields.firstname.value.trim() ? "" : "First name is required"
    );
  });

  fields.lastname.addEventListener("input", () => {
    fields.lastname.setCustomValidity(
      fields.lastname.value.trim() ? "" : "Last name is required"
    );
  });

  fields.studentId.addEventListener("input", () => {
    const value = fields.studentId.value.trim();
    fields.studentId.setCustomValidity(
      validateStudentId(value) ? "" : "Invalid ID format (xx-xxxx-xxx) or (xxxx-xxxxx)"
    );
  });

  fields.email.addEventListener("input", () => {
    const value = fields.email.value.trim();
    fields.email.setCustomValidity(
      validateEmail(value) ? "" : "Email must end with @cit.edu"
    );
  });

  fields.password.addEventListener("input", () => {
    fields.password.setCustomValidity(
      fields.password.value.trim() ? "" : "Password is required"
    );
  });

  fields.confirmPassword.addEventListener("input", () => {
    if (!fields.confirmPassword.value.trim()) {
      fields.confirmPassword.setCustomValidity("Confirm your password");
    } else if (fields.password.value !== fields.confirmPassword.value) {
      fields.confirmPassword.setCustomValidity("Passwords do not match");
    } else {
      fields.confirmPassword.setCustomValidity("");
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let isValid = true;

    // Reset custom validity
    Object.values(fields).forEach(field => field.setCustomValidity(""));

    // Validate all fields
    if (!fields.firstname.value.trim()) { 
      fields.firstname.setCustomValidity("First name is required"); 
      isValid = false; 
    }
    if (!fields.lastname.value.trim()) { 
      fields.lastname.setCustomValidity("Last name is required"); 
      isValid = false; 
    }
    if (!fields.studentId.value.trim() || !validateStudentId(fields.studentId.value.trim())) {
      fields.studentId.setCustomValidity("Invalid ID format (xx-xxxx-xxx) or (xxxx-xxxxx)"); 
      isValid = false;
    }
    if (!fields.email.value.trim() || !validateEmail(fields.email.value.trim())) {
      fields.email.setCustomValidity("Email must end with @cit.edu"); 
      isValid = false;
    }
    if (!fields.password.value.trim()) { 
      fields.password.setCustomValidity("Password is required"); 
      isValid = false; 
    }
    if (!fields.confirmPassword.value.trim() || fields.password.value !== fields.confirmPassword.value) {
      fields.confirmPassword.setCustomValidity("Passwords do not match"); 
      isValid = false;
    }

    // If not valid, show first error
    if (!isValid) {
      const firstInvalid = Object.values(fields).find(field => !field.checkValidity());
      if (firstInvalid) {
        firstInvalid.focus();
        firstInvalid.reportValidity();
      }
      return;
    }

    // If all valid, submit the form normally (Django will handle it)
    console.log("Form is valid, submitting to Django...");
    form.submit();
  });

  // Add real-time validation feedback
  Object.values(fields).forEach(field => {
    field.addEventListener("blur", () => {
      if (!field.checkValidity()) {
        field.reportValidity();
      }
    });
  });
});