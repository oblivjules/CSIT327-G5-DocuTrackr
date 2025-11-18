// Elements
const editBtn = document.getElementById("editBtn");
const modal = document.getElementById("editModal");
const closeModal = document.getElementById("closeModal");
const saveName = document.getElementById("saveName");
const displayName = document.getElementById("displayName");
const newNameInput = document.getElementById("newName");
const passwordForm = document.getElementById("passwordForm");

// Open modal
editBtn.addEventListener("click", () => {
  modal.style.display = "flex";
  newNameInput.value = displayName.textContent;
});

// Close modal
closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

// Save new name    
saveName.addEventListener("click", () => {
  const newName = newNameInput.value.trim();
  if (newName) {
    displayName.textContent = newName;
    alert("Name updated successfully!");
    modal.style.display = "none";
  } else {
    alert("Please enter a valid name.");
  }
});

// Password change logic
passwordForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const oldPass = document.getElementById("oldPassword").value;
  const newPass = document.getElementById("newPassword").value;
  const confirmPass = document.getElementById("confirmPassword").value;

  if (!oldPass || !newPass || !confirmPass) {
    alert("Please fill in all fields.");
    return;
  }

  if (newPass !== confirmPass) {
    alert("New passwords do not match!");
    return;
  }

  alert("Password changed successfully!");
  passwordForm.reset();
});

document.querySelectorAll(".toggle-password").forEach(button => {
  button.addEventListener("click", () => {
    const targetId = button.getAttribute("data-target");
    const input = document.getElementById(targetId);

    if (input.type === "password") {
      input.type = "text";
      button.textContent = "🙈"; // Hide icon
    } else {
      input.type = "password";
      button.textContent = "👁️"; // Show icon
    }
  });
});