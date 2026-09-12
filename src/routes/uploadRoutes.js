// backend/src/routes/uploadRoutes.js
const express = require('express')
const multer = require('multer')
const router = express.Router()
const uploadController = require('../controllers/uploadController')
const { authenticate } = require('../middlewares/auth')

// Configuration multer en mémoire vive (RAM)
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Seuls les formats images (JPEG, PNG, WEBP, GIF) sont acceptés.'), false)
    }
  },
})

// Upload d'image (accessible avec token ou pour les formulaires)
router.post('/image', upload.single('file'), uploadController.uploadImage)

module.exports = router
