function showNotification(type, message) {
  const container = document.getElementById("notification-container");

  // Create new notification element
  const notif = document.createElement("div");
  notif.classList.add("notification", type);
  notif.textContent = message;

  container.appendChild(notif);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    notif.style.animation = "fadeOut 0.5s forwards";
    notif.addEventListener("animationend", () => notif.remove());
  }, 3000);
}
