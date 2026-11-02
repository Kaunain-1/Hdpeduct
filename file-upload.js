// ==========================================
// CONFIGURATION & CREDENTIALS
// ==========================================
const CLOUDINARY_CLOUD_NAME = "hdpe_products";
const CLOUDINARY_UPLOAD_PRESET = "hdpe_products";

const ADMIN_ID = "admin@hdpeduct";
const ADMIN_PASSWORD = "admin";

// ==========================================
// THEME & DYNAMIC LOGO HANDLER
// ==========================================
function updateLogo(theme) {
    // Selects the header logo
    const logoImg = document.getElementById("siteLogo") || document.querySelector("header img, .navbar-brand img, .logo");
    if (!logoImg) return;

    if (theme === "dark") {
        logoImg.src = "Images/logo_dark.png";
    } else {
        logoImg.src = "Images/logo.png";
    }
}

function applyTheme(theme) {
    if (theme === "dark") {
        document.body.classList.add("dark-theme");
        document.documentElement.setAttribute("data-theme", "dark");
    } else {
        document.body.classList.remove("dark-theme");
        document.documentElement.setAttribute("data-theme", "light");
    }

    localStorage.setItem("theme", theme);
    updateLogo(theme);
}

// ==========================================
// ADMIN MODE UI TOGGLE
// ==========================================
function checkAdminState() {
    const isLoggedIn = sessionStorage.getItem("isAdminLoggedIn") === "true";
    const adminUploadSection = document.querySelector("#upload-section, .admin-panel, #admin-controls");
    const adminLoginBtn = document.querySelector("#adminLoginBtn, .admin-login-btn, a[href*='admin']");

    if (isLoggedIn) {
        if (adminUploadSection) adminUploadSection.style.display = "block";
        if (adminLoginBtn) adminLoginBtn.textContent = "Admin Active (Logout)";
    }
}

// ==========================================
// DOM INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize Dark Theme by Default
    const savedTheme = localStorage.getItem("theme") || "dark";
    applyTheme(savedTheme);

    // Wire Theme Toggle Button if present
    const themeBtn = document.querySelector("#themeToggle, .theme-toggle");
    if (themeBtn) {
        themeBtn.addEventListener("click", () => {
            const isDark = document.body.classList.contains("dark-theme");
            applyTheme(isDark ? "light" : "dark");
        });
    }

    // 2. Check if Admin is already logged in
    checkAdminState();

    // 3. Connect Admin Login Handler
    const loginForm = document.querySelector("#loginForm, #adminLoginForm, .admin-login-modal form, .modal form");
    const loginBtn = document.querySelector("#loginBtn, button[type='submit'], .modal button.btn-primary");

    if (loginForm) {
        loginForm.addEventListener("submit", handleAdminLogin);
    } else if (loginBtn) {
        loginBtn.addEventListener("click", handleAdminLogin);
    }

    // 4. Product Upload Handler (Cloudinary)
    const uploadForm = document.querySelector("#upload-form, form#productForm") || document.querySelector("form:not(.login-form)");
    const fileInput = document.querySelector('input[type="file"]');

    if (uploadForm && fileInput) {
        uploadForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const file = fileInput.files[0];
            if (!file) {
                alert("Please select an image file to upload.");
                return;
            }

            const submitBtn = uploadForm.querySelector('button[type="submit"], input[type="submit"]');
            const originalBtnText = submitBtn ? (submitBtn.innerText || submitBtn.value) : "";
            if (submitBtn) {
                if (submitBtn.tagName === "INPUT") submitBtn.value = "Uploading to Cloudinary...";
                else submitBtn.innerText = "Uploading to Cloudinary...";
                submitBtn.disabled = true;
            }

            try {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

                const uploadResponse = await fetch(
                    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                    {
                        method: "POST",
                        body: formData
                    }
                );

                if (!uploadResponse.ok) {
                    throw new Error("Cloudinary upload failed. Check cloud name and preset.");
                }

                const data = await uploadResponse.json();
                const publicImageUrl = data.secure_url;

                const inputs = uploadForm.querySelectorAll('input:not([type="file"]):not([type="submit"]), textarea, select');
                const productData = {
                    imageUrl: publicImageUrl,
                    createdAt: new Date().toISOString()
                };

                inputs.forEach(input => {
                    if (input.name) productData[input.name] = input.value;
                });

                renderProductToUI(productData);
                alert("Product uploaded successfully to Cloudinary!");
                uploadForm.reset();

            } catch (error) {
                console.error("Upload error:", error);
                alert("Upload failed: " + error.message);
            } finally {
                if (submitBtn) {
                    if (submitBtn.tagName === "INPUT") submitBtn.value = originalBtnText;
                    else submitBtn.innerText = originalBtnText;
                    submitBtn.disabled = false;
                }
            }
        });
    }
});

// ==========================================
// ADMIN LOGIN VERIFICATION
// ==========================================
function handleAdminLogin(event) {
    if (event) event.preventDefault();

    // Query inputs flexibly to match your modal fields
    const idInput = document.querySelector('#adminId, #adminUsername, input[type="text"], input[type="email"]');
    const passInput = document.querySelector('#adminPassword, #password, input[type="password"]');
    const errorMsg = document.querySelector('.error-message, #loginError, .login-error');

    const enteredId = idInput ? idInput.value.trim() : "";
    const enteredPass = passInput ? passInput.value.trim() : "";

    if (enteredId === ADMIN_ID && enteredPass === ADMIN_PASSWORD) {
        sessionStorage.setItem("isAdminLoggedIn", "true");

        // Close modal
        const loginModal = document.querySelector('#loginModal, .modal, .admin-modal');
        if (loginModal) {
            loginModal.style.display = "none";
            loginModal.classList.remove("show", "active");
        }

        // Show admin controls
        checkAdminState();
        alert("Login successful! Welcome Admin.");
    } else {
        if (errorMsg) {
            errorMsg.textContent = "Invalid Admin ID or Password.";
            errorMsg.style.display = "block";
        } else {
            alert("Invalid Admin ID or Password.");
        }
    }
}

// ==========================================
// GALLERY RENDERER
// ==========================================
function renderProductToUI(product) {
    const galleryContainer = document.querySelector(".gallery, .product-grid, .products, #products-container");
    if (!galleryContainer) return;

    const item = document.createElement("div");
    item.className = "product-card";
    item.innerHTML = `
        <img src="${product.imageUrl}" alt="${product.title || product.name || 'Product Image'}" loading="lazy" style="max-width: 100%; height: auto;" />
        ${product.name || product.title ? `<h3>${product.name || product.title}</h3>` : ''}
        ${product.price ? `<p class="price">${product.price}</p>` : ''}
        ${product.description ? `<p>${product.description}</p>` : ''}
    `;

    galleryContainer.appendChild(item);
}