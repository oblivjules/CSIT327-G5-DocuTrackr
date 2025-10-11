document.addEventListener('DOMContentLoaded', function () {
  const form = document.querySelector('form');
  const emailField = document.getElementById('email');

  form.addEventListener('submit', function(event) {
    const email = emailField.value.trim();

    // Check empty
    if (email === "") {
      emailField.setCustomValidity("Email is required");
      emailField.reportValidity();
      event.preventDefault();
      return;
    }

    // Check institutional email
    if (!email.endsWith("@cit.edu")) {
      emailField.setCustomValidity("Please enter a valid institutional email address (e.g., name@cit.edu)");
      emailField.reportValidity();
      event.preventDefault();
      return;
    }

    // Clear previous error
    emailField.setCustomValidity("");
  });

  // Clear custom validity on input
  emailField.addEventListener('input', function() {
    emailField.setCustomValidity("");
  });
});
