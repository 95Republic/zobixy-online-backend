const paymentController = require('../controllers/payment/paymentController')
const { authMiddleware } = require('../middlewares/authMiddleware')
const router = require('express').Router()



router.get('/payment/create-paystack-account',authMiddleware, paymentController.create_paystack_account)
router.put('/payment/activate-payment-account/:activeCode',authMiddleware, paymentController.activate_payment_account)
router.get('/payment/seller-payment-details/:sellerId',authMiddleware, paymentController.get_seller_payment_details)
router.post('/payment/withdrawal-request',authMiddleware, paymentController.withdrawal_request)
router.get('/payment/request',authMiddleware, paymentController.get_payment_request)
router.post('/payment/request-confirm',authMiddleware, paymentController.payment_request_confirm)

module.exports = router