# Hdpeduct — Web Application & Backend

Engineered piping solutions website with admin catalogue management and product image upload backend.

---

## Quick Start (Run Locally)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

The initial local admin sign-in is `admin@hdpeduct` / `admin`. Set the
`ADMIN_PASSWORD` environment variable before the first production start. Admin
passwords are stored as salted hashes in `data/admin-auth.json`; product
catalogue changes are shared through `data/products.json`, and uploaded images
are stored in `images/`.

---

## Hosting on Render (Recommended Solution)

The easiest and most reliable way to host this project on Render is as a **single Web Service** that serves both your frontend website and your backend upload API together. This eliminates CORS issues and requires only a single free Render service.

### Step-by-Step Render Deployment

1. **Push your code to GitHub / GitLab**.
2. Go to your [Render Dashboard](https://dashboard.render.com/) and click **New +** > **Web Service**.
3. Connect your repository.
4. Configure the service settings:
   - **Name**: `hdpeduct` (or your choice)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Click **Create Web Service**.
6. Once deployed, click the generated Render URL (e.g., `https://hdpeduct.onrender.com`).
   - Your frontend website will load directly at the root `/`.
   - Your shared product catalogue will be served by `/api/products`.
   - Admin product/image changes require an authenticated admin session.
   - Uploaded images will be served at `/images/...`.

---

### Important Note on Uploaded Images on Render Free Tier
- **Ephemeral Storage**: On Render's Free tier, the filesystem is ephemeral, meaning products, admin credentials, and uploaded images will reset whenever the service restarts.
- **For Permanent Uploads**:
  - Add a **Render Persistent Disk** (for example, mounted at `/opt/render/project/src/persistent`) and set `DATA_DIR` to `/opt/render/project/src/persistent/data` and `UPLOAD_DIR` to `/opt/render/project/src/persistent/images`, or
  - Integrate a persistent database and cloud media service such as Cloudinary or AWS S3.
