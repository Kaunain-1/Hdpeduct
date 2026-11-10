# Hdpeduct Website

This is a static website built with HTML, CSS, and browser JavaScript. It does not require Node.js, a backend server, or API endpoints. Open `index.html` directly or publish the project files to any static web host. Keep the `Images` and `assets` folders alongside `index.html`.

## Website editor

Open **Website Editor** and use admin ID `admin@hdpeduct` with the default password `admin`. The Account tab lets you change the password; it is saved in this browser's local storage.

The login is only a convenience prompt. Because the website and password check run entirely in the browser, they cannot securely prevent visitors from inspecting or changing the code or browser storage. Do not use this setup to protect confidential data or privileged actions.

Products, uploaded images, categories, partners, homepage slides, and sales data are saved in the current browser using IndexedDB, with local storage as a fallback. These changes are not uploaded or shared with other visitors and do not update the files on the static host. Use **Export site data** and **Import site data** to back up or move changes between browsers. Browser storage can be cleared or limited; keep a backup of important edits.

Product inquiries and contact forms open the visitor's email application.
