// backend/src/routes/productRoutes.js
const express = require('express')
const router = express.Router()
const productController = require('../controllers/productController')
const { authenticate, requireStaffOrAdmin } = require('../middlewares/auth')

// Public
router.get('/', productController.getProducts)
router.get('/categories', productController.getCategories)
router.get('/:slug', productController.getProductBySlug)

// Admin / Staff
router.post('/', authenticate, requireStaffOrAdmin, productController.createProduct)
router.post('/categories', authenticate, requireStaffOrAdmin, productController.createCategory)
router.put('/:id', authenticate, requireStaffOrAdmin, productController.updateProduct)
router.delete('/:id', authenticate, requireStaffOrAdmin, productController.deleteProduct)

module.exports = router
