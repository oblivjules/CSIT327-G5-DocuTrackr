// ================= HELPER =================
function getCSRFToken() {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split("=");
        if (name === "csrftoken") return value;
    }
    return "";
}

function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = msg;
        el.classList.add("show");
    }
}

function clearErrors() {
    ["err-oldPassword","err-newPassword","err-confirmPassword"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = "";
            el.classList.remove("show");
        }
    });
}

// ================= PASSWORD FORM =================
const passwordForm = document.getElementById("passwordForm");
const passwordValue = document.querySelector(".password-value");

const changeBtn = document.getElementById("changePasswordHeader");
const saveBtn   = document.getElementById("savePasswordHeader");
const cancelBtn = document.getElementById("cancelPasswordHeader");
const saveCancel = document.getElementById("saveCancelHeader");

if (changeBtn && passwordForm && passwordValue && saveCancel) {
    changeBtn.addEventListener("click", () => {
        passwordValue.style.display = "none";
        passwordForm.style.display = "block";
        changeBtn.style.display = "none";
        saveCancel.style.display = "flex";
    });
}

if (cancelBtn && passwordForm && passwordValue && saveCancel && changeBtn) {
    cancelBtn.addEventListener("click", () => {
        passwordForm.reset();
        passwordForm.style.display = "none";
        passwordValue.style.display = "block";
        saveCancel.style.display = "none";
        changeBtn.style.display = "inline-block";
        clearErrors();
    });
}

if (saveBtn && passwordForm) {
    saveBtn.addEventListener("click", () => passwordForm.requestSubmit());
}

// ================= PASSWORD REQUIREMENTS =================
const reqLength = document.getElementById("req-length");
const reqUpper  = document.getElementById("req-uppercase");
const reqNum    = document.getElementById("req-number");
const reqSpec   = document.getElementById("req-special");

const newPassInput = document.getElementById("newPassword");
if (newPassInput && reqLength && reqUpper && reqNum && reqSpec) {
    newPassInput.addEventListener("input", () => {
        const v = newPassInput.value;
        reqLength.classList.toggle("valid", v.length >= 8);
        reqLength.classList.toggle("invalid", v.length < 8);
        reqUpper.classList.toggle("valid", /[A-Z]/.test(v));
        reqUpper.classList.toggle("invalid", !/[A-Z]/.test(v));
        reqNum.classList.toggle("valid", /[0-9]/.test(v));
        reqNum.classList.toggle("invalid", !/[0-9]/.test(v));
        reqSpec.classList.toggle("valid", /[^A-Za-z0-9]/.test(v));
        reqSpec.classList.toggle("invalid", !/[^A-Za-z0-9]/.test(v));
    });
}

// ================= SHOW/HIDE PASSWORD =================
document.querySelectorAll(".toggle-password").forEach(btn => {
    btn.addEventListener("click", () => {
        const target = document.getElementById(btn.dataset.target);
        if (target) {
            if (target.type === "password") {
                target.type = "text";
                btn.textContent = "Hide";
            } else {
                target.type = "password";
                btn.textContent = "Show";
            }
        }
    });
});

function showSuccessToast(msg) {
    const toast = document.getElementById("successToast");
    if (!toast) return;

    toast.textContent = msg;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// ================= FORM SUBMIT =================
if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearErrors();

        const oldPassword = document.getElementById("oldPassword");
        const newPassword = document.getElementById("newPassword");
        const confirmPassword = document.getElementById("confirmPassword");

        if (!oldPassword || !newPassword || !confirmPassword) {
            console.error("Password form elements not found");
            return;
        }

        const oldP = oldPassword.value.trim();
        const newP = newPassword.value.trim();
        const confP = confirmPassword.value.trim();

        let valid = true;

        if (!oldP) { 
            showError("err-oldPassword", "Current password is required"); 
            valid = false; 
        }
        if (!newP) { 
            showError("err-newPassword", "Enter a new password"); 
            valid = false; 
        }
        if (!confP) { 
            showError("err-confirmPassword", "Confirm your password"); 
            valid = false; 
        }

        if (newP !== confP) {
            showError("err-confirmPassword", "Passwords do not match");
            valid = false;
        }

        if (!reqLength || !reqUpper || !reqNum || !reqSpec) {
            showError("err-newPassword", "Password requirements not loaded");
            valid = false;
        } else if (!reqLength.classList.contains("valid") ||
            !reqUpper.classList.contains("valid") ||
            !reqNum.classList.contains("valid") ||
            !reqSpec.classList.contains("valid")) {
            showError("err-newPassword", "Password does not meet requirements");
            valid = false;
        }

        if (!valid) return;

        // ================================
        // SEND CHANGE PASSWORD REQUEST
        // ================================
        try {
            const res = await fetch("/change-password/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-CSRFToken": getCSRFToken(),
                },
                body: new URLSearchParams({
                    old_password: oldP,
                    new_password: newP,
                    confirm_password: confP
                })
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data.success) {
                showError("err-oldPassword", data.error || "Incorrect password.");
                return;
            }

            // SUCCESS
            passwordForm.reset();
            passwordForm.style.display = "none";
            if (passwordValue) passwordValue.style.display = "block";
            if (saveCancel) saveCancel.style.display = "none";
            if (changeBtn) changeBtn.style.display = "inline-block";

            showSuccessToast("Password changed successfully!");
        } catch (error) {
            console.error("Error changing password:", error);
            showError("err-oldPassword", "An error occurred. Please try again.");
        }
    });
}
