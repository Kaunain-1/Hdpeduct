const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// 1. Enable CORS & parse JSON
app.use(cors());
app.use(express.json());

// 2. Serve static images so the frontend can load them
app.use('/images', express.static(path.join(__dirname, 'images')));

// 3. Define Storage Engine (Where to save & what to name files)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images/');
  },
  filename: (req, file, cb) => {
    // Generates: fieldname-timestamp-randomnumber.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 4. File Filter (Validation: allow only image types)
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

// 5. Initialize Multer with Storage, Limits (5MB), and Filter
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB maximum size
  fileFilter: fileFilter
});

// 6. POST Upload Endpoint
app.post('/upload', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Multer-specific error (e.g., file too large)
      return res.status(400).json({ error: err.message });
    } else if (err) {
      // Custom validation error (e.g., wrong file type)
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return the saved file information and relative URL
    res.status(200).json({
      message: 'File uploaded successfully!',
      filename: req.file.filename,
      imageUrl: `http://localhost:${PORT}/images/${req.file.filename}`
    });
  });
});

// 7. Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});