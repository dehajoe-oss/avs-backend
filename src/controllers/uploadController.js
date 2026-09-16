// backend/src/controllers/uploadController.js
const cloudinary = require('cloudinary').v2

// Configuration Cloudinary si variables d'environnement présentes
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

/**
 * Upload d'une image (produit, avatar, preuve de virement, ordonnance)
 */
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni.',
      })
    }

    const folder = req.body.folder || 'avs-uploads'

    // Si Cloudinary est configuré
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      const uploadPromise = new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `avs/${folder}`,
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          },
          (error, result) => {
            if (error) return reject(error)
            resolve(result)
          }
        )
        stream.end(req.file.buffer)
      })

      const result = await uploadPromise

      return res.json({
        success: true,
        message: 'Image uploadée avec succès sur Cloudinary.',
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
        },
      })
    }

    // Fallback si pas de Cloudinary configuré (ex: local offline) : renvoie data URI base64
    const base64Data = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
    return res.json({
      success: true,
      message: 'Image reçue (mode local / base64).',
      data: {
        url: base64Data,
        fileName: req.file.originalname,
        size: req.file.size,
      },
    })
  } catch (error) {
    next(error)
  }
}
