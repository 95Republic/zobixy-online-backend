const formidable = require("formidable")
const cloudinary = require('cloudinary').v2
const { responseRouter } = require("../../utilities/response")
const myShopWalletModel = require('../../models/myShopWallet')
const sellerWalletModel = require('../../models/sellerWallet')
const productModel = require('../../models/productModel')
const authOrderModel = require('../../models/authOrderModel')
const customerOrderModel = require('../../models/customerOrderModel')
const sellerModel = require('../../models/sellerModel')
const adminSellerMessageModel = require('../../models/chat/adminSellerMessage')
const sellerCustomerMessageModel = require('../../models/chat/sellerCustomerMessage')
const bannerModel = require('../../models/bannerModel')
const {mongo: {ObjectId}} = require('mongoose')

class dashboardController{

    get_admin_dashboard_data = async(req,res) => {
        console.log("Calling get admin dashboard data")
        const {id} = req
        try {

            const totalSales = await myShopWalletModel.aggregate([
                {
                    $group: {
                        _id:null,
                        totalAmount: {$sum: '$amount'}
                    }
                }
            ])
            const totalProducts = await productModel.find({}).countDocuments()
            const totalOrders = await customerOrderModel.find({}).countDocuments()
            const totalSellers = await sellerModel.find({}).countDocuments()
            const messages = await adminSellerMessageModel.find({}).limit(3)
            const recentOrders = await customerOrderModel.find({}).limit(5)

            responseRouter(res, 200,{
                totalProducts,
                totalOrders,
                totalSellers,
                messages,
                recentOrders,
                totalSales: totalSales.length > 0 ? totalSales[0].totalAmount : 0
            })
            
        } catch (error) {
            console.log(error.message)
            responseRouter(res, 500,{ error: error.message})
        }

        
    }

    /// end method



    get_seller_dashboard_data = async(req,res) => {
        console.log("Calling get seller dashboard data")
        const {id} = req
        try {

            const totalSales = await sellerWalletModel.aggregate([
                {
                    $match: {
                        sellerId: {
                            $eq: id
                        }
                    }
                },{
                    $group: {
                        _id:null,
                        totalAmount: {$sum: '$amount'}
                    }
                }
            ])

            const totalProducts = await productModel.find({ 
                sellerId: new ObjectId(id)
            }).countDocuments()


            const totalOrders = await authOrderModel.find({
                sellerId: new ObjectId(id)
            }).countDocuments()


            const totalPendingOrders = await authOrderModel.find({
                $and: [
                    {
                        sellerId: {
                            $eq: new ObjectId(id)
                        }
                    },{
                        delivery_status: {
                            $eq: 'pending'
                        }
                    }
            ]}).countDocuments()


            const messages = await sellerCustomerMessageModel.find({
                $or: [
                    {
                        senderId: {
                            $eq: id
                        }
                    },{
                        receiverId: {
                            $eq: id
                        }
                    }
                ]
            }).limit(3)

            const recentOrders = await authOrderModel.find({
                sellerId: new ObjectId(id)
            }).limit(5)

            responseRouter(res, 200,{
                totalProducts,
                totalOrders,
                totalPendingOrders,
                messages,
                recentOrders,
                totalSales: totalSales.length > 0 ? totalSales[0].totalAmount : 0
            })
            
        } catch (error) {
            console.log(error.message)
            responseRouter(res, 500,{ error: error.message})
        }

        
    }

    /// end method

    add_banner = async(req,res) => {
        console.log("Calling add banner")
        const form = formidable({multiples: true})
        form.parse(req, async(err,field,files) => {
            const {productId} = field
            const {mainbanner} = files  

            //cloud connection
            cloudinary.config({
            cloud_name: process.env.cloud_name,
            api_key: process.env.api_key,
            api_secret: process.env.api_secret,
            secure: true
            })
        
            try {
            //upload image 
            const {slug} = await productModel.findById(productId)
            const result = await cloudinary.uploader.upload(mainbanner.filepath, { folder: 'banners' })
            const banner = await bannerModel.create({
                productId,
                banner: result.url,
                link: slug
            })

            if (result) {
                responseRouter(res, 200, {banner, message: 'Banner was uploaded Successfully!'})
                
            }else{
                responseRouter(res, 404, {error : 'Banner Upload Failed!'})
            }
                
            } catch (error) {
                responseRouter(res, 500, {error : error.message})
            }
        })

        
    }

    // end method


    get_banner = async(req,res) => {
        console.log("Calling get banner")
        const {productId} = req.params

        try {

            const banner = await bannerModel.findOne({ productId: new ObjectId(productId)})
            responseRouter(res, 200, {banner})
            
        } catch (error) {
            responseRouter(res, 500, {error : error.message})
        }
    }

    // end method


    update_banner = async(req,res) => {
        console.log("Calling update banner")
        const {bannerId} = req.params

        const form = formidable({})
        form.parse(req, async(err,_,files) => {
            const {mainbanner} = files  

            //cloud connection
            cloudinary.config({
            cloud_name: process.env.cloud_name,
            api_key: process.env.api_key,
            api_secret: process.env.api_secret,
            secure: true
            })
        
            try {
            let banner = await bannerModel.findById(bannerId)
            let temp = banner.banner.split('/')
            temp = temp[temp.length -1]
            const imageName = temp.split('.')[0]
            await cloudinary.uploader.destroy(imageName)


            const {url} = await cloudinary.uploader.upload(mainbanner.filepath, { folder: 'banners' })

            await bannerModel.findByIdAndUpdate(bannerId,{
                banner: url
            })

            banner = await bannerModel.findById(bannerId)

            if (banner) {
                responseRouter(res, 200, {banner, message: 'Banner updated Successfully!'})
                
            }else{
                responseRouter(res, 404, {error : 'Banner update Failed!'})
            }
                
            } catch (error) {
                responseRouter(res, 500, {error : error.message})
            }
        })
    }

    // end method

    get_banners = async(req,res) => {
        console.log("Calling get banners")

        try {

            const banners = await bannerModel.aggregate([{
                $sample: {
                    size: 5
                }
            }
        ])
        responseRouter(res, 200, {banners})
            
        } catch (error) {
            responseRouter(res, 500, {error : error.message})
        }
    }

    // end method
}

module.exports = new dashboardController()