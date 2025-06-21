const cartController = require('../../controllers/home/cartController')
const router = require('express').Router()


router.post('/home/product/add-to-cart', cartController.add_to_cart)
router.get('/home/product/get-cart-product/:userId', cartController.get_cart_products)
router.delete('/home/product/delete-cart-product/:cart_id', cartController.delete_cart_product)
router.put('/home/product/quantity-inc/:cart_id', cartController.quantity_inc)
router.put('/home/product/quantity-dec/:cart_id', cartController.quantity_dec)

router.post('/home/product/add-to-wishlist', cartController.add_to_wishlist)
router.get('/home/product/get-wishlist-products/:userId', cartController.get_wishlist_products)
router.delete('/home/product/remove-product-from-wishlist/:wishlistId', cartController.delete_product_from_wishlist)


module.exports = router