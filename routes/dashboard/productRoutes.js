const productController = require('../../controllers/dashboard/productController')
const { authMiddleware } = require('../../middlewares/authMiddleware') //checks if user is logged in
const router = require('express').Router()

router.post('/product-add', authMiddleware, productController.add_product)
router.get('/products-get', authMiddleware, productController.products_get)
router.get('/product-get/:productId', authMiddleware, productController.product_get)
router.post('/product-update', authMiddleware, productController.product_update)
router.post('/product-image-update', authMiddleware, productController.product_image_update)


module.exports = router