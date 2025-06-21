const formidable = require("formidable")
const { responseRouter } = require("../../utilities/response")
const cloudinary = require('cloudinary').v2
const sellerModel = require('../../models/sellerModel')

class sellerController{

    request_seller_get = async (req,res) => {

        const {page,searchValue, parPage} = req.query //getting input data from query
        const skipPage = parseInt(parPage) * (parseInt(page) -1 )

        try {
            if (searchValue) {
                
            } else {
                const sellers = await sellerModel.find({status: 'pending'}).skip(skipPage).limit(parPage).sort({ createdAt: -1})

                const totalSeller = await sellerModel.find({status: 'pending'}).countDocuments()
                responseRouter(res, 200,{ sellers,totalSeller})
            }
            
        } catch (error) {
            responseRouter(res, 500,{ error: error.message})
        }
        
    }
    //END Method


    get_seller = async (req,res) => {

        const {sellerId} = req.params //getting from paramaters 

        try {

            const seller = await sellerModel.findById(sellerId)
            responseRouter(res, 200,{seller})
            
        } catch (error) {
            responseRouter(res, 500,{ error: error.message})
        }
        
    }
    //END Method



    seller_status_update = async (req,res) => {

        const {sellerId, status} = req.body //getting from request body 

        try {

            await sellerModel.findByIdAndUpdate(sellerId,{status})
            const seller = await sellerModel.findById(sellerId)
            responseRouter(res, 200,{seller, message: "Seller status updated successfully"})
            
        } catch (error) {
            responseRouter(res, 500,{ error: error.message})
        }
        
    }
    //END Method



    get_active_sellers = async (req,res) => {

        let {page, searchValue, parPage} = req.query 
        page = parseInt(page)
        parPage = parseInt(parPage)

        const skipPage = parPage * (page -1)

        try {
            if (searchValue) {
                const sellers = await sellerModel.find({
                    $text: {$search: searchValue},
                    status: 'active'
                }).skip(skipPage).limit(parPage).sort({createdAt: -1})

                const totalSeller = await sellerModel.find({
                    $text: {$search: searchValue},
                    status: 'active'
                }).countDocuments()
                responseRouter(res, 200,{totalSeller,sellers})
            } else {

                const sellers = await sellerModel.find({
                    status: 'active'
                }).skip(skipPage).limit(parPage).sort({createdAt: -1})

                const totalSeller = await sellerModel.find({
                    status: 'active'
                }).countDocuments()
                responseRouter(res, 200,{totalSeller,sellers})
                
            }
            
        } catch (error) {
            console.log('Error occured calling active sellers: ' + error.message)
        }
        
    }
    //END Method



    get_deactive_sellers = async (req,res) => {

        let {page, searchValue, parPage} = req.query 
        page = parseInt(page)
        parPage = parseInt(parPage)

        const skipPage = parPage * (page -1)

        try {
            if (searchValue) {
                const sellers = await sellerModel.find({
                    $text: {$search: searchValue},
                    status: 'deactive'
                }).skip(skipPage).limit(parPage).sort({createdAt: -1})

                const totalSeller = await sellerModel.find({
                    $text: {$search: searchValue},
                    status: 'deactive'
                }).countDocuments()
                responseRouter(res, 200,{totalSeller,sellers})
            } else {

                const sellers = await sellerModel.find({
                    status: 'deactive'
                }).skip(skipPage).limit(parPage).sort({createdAt: -1})

                const totalSeller = await sellerModel.find({
                    status: 'deactive'
                }).countDocuments()
                responseRouter(res, 200,{totalSeller,sellers})
                
            }
            
        } catch (error) {
            console.log('Error occured calling deactive sellers: ' + error.message)
        }
        
    }
    //END Method

}

module.exports = new sellerController()