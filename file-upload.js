const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();

// Use the port Render assigns, or default to 3000 locally
const PORT = process.env.PORT || 3000;

// Ensure the images upload directory exists
const uploadDir = path.join(__dirname, 'images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 1. Enable CORS & parse JSON
app.use(cors());
app.use(express.json());

// 2. Serve static images so the frontend can load them
app.use('/images', express.static(uploadDir));

// 3. Define Storage Engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 4. File Filter (images only)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);

  if (extName && mimeType) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, webp, gif) are allowed!'));
  }
};

// 5. Initialize Multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: fileFilter
});

// --- Root GET Route (Fixes "Cannot GET /") ---
app.get('/', (req, res) => {
  res.send('Server is up and running successfully!');
});

// 6. POST Upload Endpoint
app.post('/upload', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Dynamic URL matching localhost locally or your Render domain in production
    const protocol = req.protocol;
    const host = req.get('host');

    res.status(200).json({
      message: 'File uploaded successfully!',
      filename: req.file.filename,
      imageUrl: `${protocol}://${host}/images/${req.file.filename}`
    });
  });
});

// 7. Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
