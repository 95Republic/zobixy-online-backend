const dashbordController = require('../../controllers/dashboard/dashboardController')
const { authMiddleware } = require('../../middlewares/authMiddleware') //checks if user is logged in
const router = require('express').Router()

router.get('/admin/get-dashboard-data', authMiddleware, dashbordController.get_admin_dashboard_data)
router.get('/seller/get-dashboard-data', authMiddleware, dashbordController.get_seller_dashboard_data)
router.post('/banner/add', authMiddleware, dashbordController.add_banner)
router.get('/banner/get-banner/:productId',authMiddleware,dashbordController.get_banner)
router.put('/banner/update-banner/:bannerId',authMiddleware,dashbordController.update_banner)
router.get('/banners',dashbordController.get_banners)


module.exports = router