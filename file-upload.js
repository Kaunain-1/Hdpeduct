const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, 'images');
const productsFile = path.join(dataDir, 'products.json');
const adminFile = path.join(dataDir, 'admin-auth.json');
const sessionLifetime = 8 * 60 * 60 * 1000;
const adminSessions = new Map();

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadDir, { recursive: true });

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function saveAdminCredential(password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const credential = { salt, hash: hashPassword(password, salt) };
  fs.writeFileSync(adminFile, JSON.stringify(credential, null, 2), 'utf8');
  return credential;
}

function loadAdminCredential() {
  if (fs.existsSync(adminFile)) {
    const credential = JSON.parse(fs.readFileSync(adminFile, 'utf8'));
    if (typeof credential.salt !== 'string' || typeof credential.hash !== 'string') {
      throw new Error('The saved admin credential is invalid.');
    }
    return credential;
  }
  if ((process.env.NODE_ENV === 'production' || process.env.RENDER) && !process.env.ADMIN_PASSWORD) {
    throw new Error('Set ADMIN_PASSWORD before starting the production server for the first time.');
  }
  return saveAdminCredential(process.env.ADMIN_PASSWORD || 'admin');
}

let adminCredential = loadAdminCredential();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

function issueSession(res) {
  const token = crypto.randomBytes(32).toString('hex');
  adminSessions.set(token, Date.now() + sessionLifetime);
  res.json({ token });
}

function requireAdmin(req, res, next) {
  const match = /^Bearer ([a-f0-9]{64})$/.exec(req.get('authorization') || '');
  const expiresAt = match && adminSessions.get(match[1]);
  if (!expiresAt || expiresAt <= Date.now()) {
    if (match) adminSessions.delete(match[1]);
    return res.status(401).json({ error: 'Admin sign-in is required.' });
  }
  next();
}

function validProducts(products) {
  if (!Array.isArray(products) || products.length > 2000) return false;
  const ids = new Set();
  return products.every(product => {
    if (!product || typeof product !== 'object' || Array.isArray(product)) return false;
    if (typeof product.id !== 'string' || !product.id || ids.has(product.id)) return false;
    if (typeof product.name !== 'string' || typeof product.category !== 'string') return false;
    const images = Array.isArray(product.images) ? product.images : product.image ? [product.image] : [];
    if (images.length > 4 || images.some(image => typeof image !== 'string' || image.startsWith('data:') || image.length > 2048)) return false;
    ids.add(product.id);
    return true;
  });
}

app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || email.toLowerCase() !== 'admin@hdpeduct' || typeof password !== 'string') {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }
  const candidate = Buffer.from(hashPassword(password, adminCredential.salt), 'hex');
  const stored = Buffer.from(adminCredential.hash, 'hex');
  if (candidate.length !== stored.length || !crypto.timingSafeEqual(candidate, stored)) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }
  issueSession(res);
});

app.post('/api/admin/logout', requireAdmin, (req, res) => {
  const token = req.get('authorization').slice('Bearer '.length);
  adminSessions.delete(token);
  res.sendStatus(204);
});

app.post('/api/admin/password', requireAdmin, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: 'Enter the current password and a new password of at least 6 characters.' });
  }
  const candidate = Buffer.from(hashPassword(currentPassword, adminCredential.salt), 'hex');
  const stored = Buffer.from(adminCredential.hash, 'hex');
  if (candidate.length !== stored.length || !crypto.timingSafeEqual(candidate, stored)) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }
  adminCredential = saveAdminCredential(newPassword);
  adminSessions.clear();
  issueSession(res);
});

app.get('/api/products', async (req, res, next) => {
  try {
    if (!fs.existsSync(productsFile)) return res.json({ products: null });
    const products = JSON.parse(await fs.promises.readFile(productsFile, 'utf8'));
    if (!validProducts(products)) throw new Error('The saved product catalogue is invalid.');
    res.json({ products });
  } catch (error) {
    next(error);
  }
});

app.put('/api/products', requireAdmin, async (req, res, next) => {
  try {
    const { products } = req.body || {};
    if (!validProducts(products)) {
      return res.status(400).json({ error: 'The product catalogue contains invalid product data.' });
    }
    const temporaryFile = `${productsFile}.${crypto.randomBytes(8).toString('hex')}.tmp`;
    await fs.promises.writeFile(temporaryFile, JSON.stringify(products, null, 2), 'utf8');
    await fs.promises.rename(temporaryFile, productsFile);
    res.json({ saved: true, count: products.length });
  } catch (error) {
    next(error);
  }
});

app.use('/data', (req, res) => res.sendStatus(404));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/images', express.static(uploadDir));

const uppercaseImagesDir = path.join(__dirname, 'Images');
if (fs.existsSync(uppercaseImagesDir)) {
  app.use('/Images', express.static(uppercaseImagesDir));
  app.use('/images', express.static(uppercaseImagesDir));
}

const extensionByMime = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif']
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + extensionByMime.get(file.mimetype));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (extensionByMime.has(file.mimetype)) return cb(null, true);
    cb(new Error('Only JPEG, PNG, WebP, or GIF images are allowed.'));
  }
});

app.post('/upload', requireAdmin, (req, res) => {
  upload.single('image')(req, res, error => {
    if (error instanceof multer.MulterError) return res.status(400).json({ error: error.message });
    if (error) return res.status(400).json({ error: error.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    res.status(200).json({
      message: 'File uploaded successfully.',
      filename: req.file.filename,
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      },
      imageUrl: `/images/${req.file.filename}`
    });
  });
});

app.get('/health', (req, res) => res.status(200).json({ status: 'ok', uptime: process.uptime() }));
app.use(express.static(__dirname, { index: false }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.use((error, req, res, next) => {
  console.error('Request failed.', error);
  if (res.headersSent) return next(error);
  res.status(500).json({ error: 'The server could not complete the request.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
