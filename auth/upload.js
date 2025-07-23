const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

// Carpeta donde se guardarán las imágenes procesadas
const uploadFolder = path.join(__dirname, '../public/uploads/menus');
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder, { recursive: true });

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // máx 5MB antes del resize
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
      return cb(new Error('Solo se permiten imágenes JPG y PNG'));
    }
    cb(null, true);
  }
});

const processImage = async (req, res, next) => {
  if (!req.file) return next();

  const fileName = `menu_${Date.now()}.webp`; // formato optimizado
  const filePath = path.join(uploadFolder, fileName);

  try {
    await sharp(req.file.buffer)
      .resize(200, 200)
      .webp({ quality: 70 })
      .toFile(filePath);

    req.imagePath = `/uploads/menus/${fileName}`;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  upload,
  processImage
};
