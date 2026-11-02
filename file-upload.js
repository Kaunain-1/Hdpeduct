// ==========================================
// ZERO-BACKEND CLOUD STORAGE HANDLER
// ==========================================

// Replace these two values with your Cloudinary credentials:
const CLOUDINARY_CLOUD_NAME = "hdpe_products";
const CLOUDINARY_UPLOAD_PRESET = "hdpe_products";

document.addEventListener("DOMContentLoaded", () => {
    // Locate the upload form without modifying any existing IDs/classes
    const uploadForm = document.querySelector("form") || document.getElementById("upload-form");
    const fileInput = document.querySelector('input[type="file"]');
    
    if (!uploadForm || !fileInput) return;

    uploadForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const file = fileInput.files[0];
        if (!file) {
            alert("Please select an image file to upload.");
            return;
        }

        // Show a brief loading indicator without touching layout
        const submitBtn = uploadForm.querySelector('button[type="submit"], input[type="submit"]');
        const originalBtnText = submitBtn ? (submitBtn.innerText || submitBtn.value) : "";
        if (submitBtn) {
            if (submitBtn.tagName === "INPUT") submitBtn.value = "Uploading to server...";
            else submitBtn.innerText = "Uploading to server...";
            submitBtn.disabled = true;
        }

        try {
            // 1. Upload the image directly to Cloudinary
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
                throw new Error("Failed to upload image to cloud server.");
            }

            const data = await uploadResponse.json();
            const publicImageUrl = data.secure_url; // Global HTTPS link visible to all users

            // 2. Gather other form inputs (e.g. title, price, description)
            const inputs = uploadForm.querySelectorAll('input:not([type="file"]):not([type="submit"]), textarea, select');
            const productData = {
                imageUrl: publicImageUrl,
                createdAt: new Date().toISOString()
            };

            inputs.forEach(input => {
                if (input.name) {
                    productData[input.name] = input.value;
                }
            });

            // 3. Save or render the product
            // If you are rendering directly into the existing gallery:
            renderProductToUI(productData);

            alert("Product and image uploaded successfully! Visible to all users.");
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
});

/**
 * Appends the new product to your existing DOM container
 */
function renderProductToUI(product) {
    const galleryContainer = document.querySelector(".gallery, .product-grid, .products, #products-container");
    if (!galleryContainer) return;

    const item = document.createElement("div");
    item.className = "product-card"; // Preserves your CSS styling
    item.innerHTML = `
        <img src="${product.imageUrl}" alt="${product.title || product.name || 'Product Image'}" loading="lazy" style="max-width: 100%; height: auto;" />
        ${product.name || product.title ? `<h3>${product.name || product.title}</h3>` : ''}
        ${product.price ? `<p class="price">${product.price}</p>` : ''}
        ${product.description ? `<p>${product.description}</p>` : ''}
    `;

    galleryContainer.appendChild(item);
}