document.addEventListener("DOMContentLoaded", () => {
  const proofModal = document.getElementById("proofModal");
  const proofImage = document.getElementById("proofImage");
  const proofClose = proofModal.querySelector(".close-btn");

  const proofButtons = document.querySelectorAll(".view-proof-btn");

  const processModal = document.getElementById("processModal");
  const statusDropdown = document.getElementById("statusDropdown");
  const remarks = document.getElementById("remarks");
  const confirmProcess = document.getElementById("confirmProcess");
  const cancelProcess = document.getElementById("cancelProcess");
  const closeModal = document.getElementById("closeModal");
  const requestIdField = document.getElementById("requestId");

  let selectedRequestId = null;

  // --- VIEW PROOF ---
  proofButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      let imgUrl = btn.getAttribute("data-img-url");

      // Remove any leftover unicode escapes
      imgUrl = imgUrl.replace(/\\u002D/g, "-").trim();

      if (!imgUrl.startsWith("http")) {
        console.error("Invalid proof URL:", imgUrl);
        alert("Invalid proof URL.");
        return;
      }

      proofImage.src = imgUrl;

      proofImage.onload = () => {
        console.log("✅ Modal should open now");
        proofModal.style.display = "flex";
        document.body.style.overflow = "hidden";
      }
      
      console.log("Loaded proof image:", proofImage.src);

      proofImage.onerror = () => {
        console.error("Failed to load proof image:", imgUrl);
        alert("Unable to display image. Please check if the proof file exists.");
      };
    });

  proofClose?.addEventListener("click", () => {
    proofModal.style.display = "none";
    proofImage.removeAttribute("src");
    document.body.style.overflow = "auto";
  });

  proofModal.addEventListener("click", (e) => {
    if (e.target === proofModal) {
      proofModal.style.display = "none";
      proofImage.removeAttribute("src");
      document.body.style.overflow = "auto";
    }
  });

  // --- OPEN PROCESS MODAL ---
  document.querySelectorAll(".process-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedRequestId = btn.dataset.requestId;
      requestIdField.textContent = `REQ-${selectedRequestId}`;
      processModal.style.display = "block";
    });
  });

  // --- CLOSE MODAL ---
  [cancelProcess, closeModal].forEach((el) =>
    el.addEventListener("click", () => {
      processModal.style.display = "none";
      selectedRequestId = null;
    })
  );

  // --- CONFIRM UPDATE ---
  confirmProcess.addEventListener("click", async () => {
    if (!selectedRequestId) return;
    const newStatus = statusDropdown.value;
    const remarkText = remarks.value;

    try {
      const res = await fetch(`/update-status/${selectedRequestId}/`, {
        method: "POST",
        headers: {
          "X-CSRFToken": getCSRFToken(),
        },
        body: new URLSearchParams({
          status: newStatus,
          remarks: remarkText,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Status updated successfully!");
        const statusCell = document.querySelector(
          `tr[data-request-id="${selectedRequestId}"] .status-cell .badge`
        );
        if (statusCell) {
          statusCell.textContent = newStatus.toUpperCase();
          statusCell.className = `badge ${newStatus}`;
        }
      } else {
        alert("Error updating status: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update status. Check console.");
    } finally {
      processModal.style.display = "none";
      selectedRequestId = null;
    }
  });

  function getCSRFToken() {
    const name = "csrftoken";
    const cookies = document.cookie.split(";").map((c) => c.trim());
    for (let cookie of cookies) {
      if (cookie.startsWith(name + "=")) {
        return decodeURIComponent(cookie.split("=")[1]);
      }
    }
    return "";
  }
});
})
