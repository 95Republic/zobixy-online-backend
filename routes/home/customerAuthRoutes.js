const customerAuthController = require('../../controllers/home/customerAuthController')
const router = require('express').Router()


router.post('/customer-register', customerAuthController.customer_register)
router.post('/customer-login', customerAuthController.customer_login)

router.get('/logout', customerAuthController.customer_logout)
module.exports = router