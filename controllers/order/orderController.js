const moment = require("moment")
const myShopWallet = require("../../models/myShopWallet")
const sellerWallet = require("../../models/sellerWallet")
const cartModel = require("../../models/cartModel")
const { responseRouter } = require("../../utilities/response")
const customerOrderModel = require("../../models/customerOrderModel")
const authOrderModel = require("../../models/authOrderModel")
const { mongo: {ObjectId} } = require('mongoose')
require('dotenv').config();

class orderController{

    paymentCheck = async (id) => {
        try{
            const order = await customerOrderModel.findById(id)
            if(order.payment_status === 'unpaid'){
                await customerOrderModel.findByIdAndUpdate(id, {delivery_status: 'cancelled'})
                await authOrderModel.updateMany({
                    orderId: id
                },{
                    delivery_status: 'cancelled'
                })
            }
            return true

        }catch(error)
        {
            console.log(error)
        }
    }
    //End method

    place_order = async (req,res) => {
        
        console.log("Calling place order")
        const {price,products,shipping_fee,shippingInfo,userId} = req.body
        let authorOrderData = []
        let cartId = []
        const tempDate = moment(Date.now()).format('LLL') //format e.g) Februar 1, 2024 

        let customerOrderProduct = []

        for (let i = 0; i < products.length; i++) {
            const pro = products[i].products;
            for (let j = 0; j < pro.length; j++) {
                const tempCustomerPro = pro[j].productInfo;
                tempCustomerPro.quantity = pro[j].quantity
                customerOrderProduct.push(tempCustomerPro)

                if (pro[j]._id) {
                    cartId.push(pro[j]._id)
                    
                }
                
            }
            
        }


        try {

            const order = await customerOrderModel.create({
                customerId: userId,shippingInfo,
                products: customerOrderProduct,
                price: price + shipping_fee,
                payment_status: 'unpaid',
                delivery_status: 'pending',
                date: tempDate
            })
            
            for (let i = 0; i < products.length; i++) {
                const pro = products[i].products;
                const pri = products[i].price
                const sellerId = products[i].sellerId
                let storePro = []

                for (let j = 0; j < pro.length; j++) {
                    const tempPro = pro[j].productInfo;
                    tempPro.quantity = pro[j].quantity

                    storePro.push(tempPro)
                }
                authorOrderData.push({
                    orderId: order.id,sellerId,
                    products: storePro,
                    price: pri,
                    payment_status: 'unpaid',
                    shippingInfo: 'Zobixy Main Warehouse',
                    delivery_status: 'pending',
                    date: tempDate
                })
                
            }

            await authOrderModel.insertMany(authorOrderData)
            for (let k = 0; k < cartId.length; k++) {
                await cartModel.findByIdAndDelete(cartId[k])
                
            }


            setTimeout(() => {
                this.paymentCheck(order.id)
            }, 15000)

            responseRouter(res,200, {message: "Order Placed Successfully", orderId: order.id})
                

        } catch (error) {
            console.log(error.message)
            
        }

        
    }

    //END Method

    

    get_dashboard_index_data = async (req,res) => {
        
        console.log("Calling get dashboard index data")
        const {userId} = req.params
        try {
            const recentOrders = await customerOrderModel.find({
                customerId: new ObjectId(userId)
            }).limit(5)

            const pendingOrders = await customerOrderModel.find({
                customerId: new ObjectId(userId),
                delivery_status: 'pending'
            }).countDocuments()

            const totalOrders = await customerOrderModel.find({
                customerId: new ObjectId(userId)
            }).countDocuments()

            const cancelledOrders = await customerOrderModel.find({
                customerId: new ObjectId(userId),
                delivery_status: 'cancelled'
            }).countDocuments()

            responseRouter(res,200, {recentOrders,
                pendingOrders,
                totalOrders,
                cancelledOrders
            })
                

        } catch (error) {
            console.log(error.message)
            
        }
        
    }

    //END Method


    get_orders = async (req,res) => {
        
        console.log("Calling get orders data")
        const {customerId, status} = req.params
        try {

            let orders = []
            if (status !== 'all') {
                orders = await customerOrderModel.find({
                    customerId: new ObjectId(customerId),
                    delivery_status: status
                })
                
            } else {
                orders = await customerOrderModel.find({
                    customerId: new ObjectId(customerId)
                })
            }

            responseRouter(res,200, {orders
            })
                

        } catch (error) {
            console.log(error.message)
            
        }
        
    }

    //END Method





    get_order_details = async (req,res) => {
        
        console.log("Calling get order details data")
        const {orderId} = req.params
        try {

            const order = await customerOrderModel.findById(orderId)

            responseRouter(res,200, {order
            })
                

        } catch (error) {
            console.log(error.message)
            
        }
        
    }

    //END Method



    get_admin_orders = async (req,res) => {
        
        console.log("Calling get admin orders")
        let {page,searchValue,parPage} = req.query
        page = parseInt(page)
        parPage = parseInt(parPage)

        const skipPage = parPage * (page -1)
        try {

            if (searchValue) {
                
            } else {
                const orders = await customerOrderModel.aggregate([
                    {
                        $lookup: {
                            from: 'authororders',
                            localField: "_id",
                            foreignField: 'orderId',
                            as: 'suborder'
                        }
                    }
                ]).skip(skipPage).limit(parPage).sort({createdAt: -1})

                const totalOrder = await customerOrderModel.aggregate([
                    {
                        $lookup: {
                            from: 'authororders',
                            localField: "_id",
                            foreignField: 'orderId',
                            as: 'suborder'
                        }
                    }
                ])
                responseRouter(res,200, {orders, totalOrder: totalOrder.length})
            }
    

        } catch (error) {
            console.log(error.message)
            
        }
        
    }

    //END Method





    get_admin_order = async (req,res) => {
        
        console.log("Calling get admin order")
        const {orderId} = req.params
     
        try {

            const order = await customerOrderModel.aggregate([
                {
                    $match: {_id: new ObjectId(orderId)}
                },
                {
                    $lookup: {
                        from: 'authororders',
                        localField: "_id",
                        foreignField: 'orderId',
                        as: 'suborder'
                    }
                }
            ])
            
            responseRouter(res,200, {order: order[0]})
            
    

        } catch (error) {
            console.log("Error calling get admin order details: " + error.message)
            
        }
        
    }

    //END Method

    
    admin_order_status_update = async (req,res) => {
        
        console.log("Calling get admin order status update")
        const {orderId} = req.params
        const {status} = req.body
     
        try {

            await customerOrderModel.findByIdAndUpdate(orderId, {delivery_status: status})
            
            responseRouter(res,200, {message: 'order status changed successfully'})
            
    

        } catch (error) {
            console.log('Error occcurede when calling admin order status update')
            responseRouter(res, 500,{ message: 'Internal Server Error'})
            
        }
        
    }

    //END Method


    get_seller_orders = async (req,res) => {
        
        console.log("Calling get seller orders")
        const {sellerId} = req.params
        let {page,searchValue,parPage} = req.query
        page = parseInt(page)
        parPage = parseInt(parPage)
        console.log(sellerId)

        const skipPage = parPage * (page -1)
        try {

            if (searchValue) {
                
            } else {
                const orders = await authOrderModel.find(
                    {
                        sellerId,
                        
                    }
                ).skip(skipPage).limit(parPage).sort({createdAt: -1})

                const totalOrder = await authOrderModel.find(
                    {
                        sellerId
                    }
                ).countDocuments()
                responseRouter(res,200, {orders, totalOrder})
            }
    

        } catch (error) {
            console.log("Something went wrong calling get seller orders: " + error.message)
            responseRouter(res,500, {message: 'Internal server error'})
        }
        
    }

    //END Method


    get_seller_order = async (req,res) => {
        
        console.log("Calling get seller order")
        const {orderId} = req.params
     
        try {

            const order = await authOrderModel.findById(orderId)
            
            responseRouter(res,200, {order})
            
    

        } catch (error) {
            console.log("Error calling get seller order details: " + error.message)
            
        }
        
    }

    //END Method

    seller_order_status_update = async (req,res) => {
        
        console.log("Calling seller order status update")
        const {orderId} = req.params
        const {status} = req.body
     
        try {

            await authOrderModel.findByIdAndUpdate(orderId, {delivery_status: status})
            
            responseRouter(res,200, {message: 'order status changed successfully'})
            
    

        } catch (error) {
            console.log('Error occcurede when calling seller order status update')
            responseRouter(res, 500,{ message: 'Internal Server Error'})
            
        }
        
    }

    //END Method

    create_payment = (req, res) => {
        console.log("Creating payment request on payfast")
        const { orderId, price } = req.body;
    try{
        if (!orderId || !price) {
            responseRouter(res,400,{ message: "Missing orderId or price" });
        }
    
        const merchant_id = process.env.PAYFAST_MERCHANT_ID;
        const merchant_key = process.env.PAYFAST_MERCHANT_KEY;

        if (!merchant_id || !merchant_key) {
            responseRouter(res,500,{ message: "Merchant credentials not set in environment variables" });
        }

        const success_status = 'payment_success';
        const payment_cancelled_status = 'payment_cancelled';
        const return_url = `http://localhost:3000/order/confirm?orderId=${orderId}&&paymentSatus=${success_status}`;
        const cancel_url = `http://localhost:3000/order/confirm?orderId=${orderId}&&paymentSatus=${payment_cancelled_status}`;
        const notify_url = 'https://yourserver.com/api/payfast/ipn';
    
        const item_name = `Order_${orderId}`;
        const amount = parseFloat(price).toFixed(2); // Ensures 2 decimal places
    
        const isInProduction = false
        const baseUrl = isInProduction 
        ? 'https://www.payfast.co.za/eng/process'
        : 'https://sandbox.payfast.co.za/eng/process';

        const queryParams = new URLSearchParams({
            merchant_id,
            merchant_key,
            amount,
            item_name,
            return_url,
            cancel_url,
            notify_url
        });

        const paymentUrl = `${baseUrl}?${queryParams.toString()}`;
        
         
        responseRouter(res,200,{ paymentUrl });
    } catch (error){
        console.error("Error creating Payfast payment URL:", error);
        responseRouter(res,500,{
            message: "Internal server error while generating payment URL",
            error: error.message
        });
    }
    };
    //END Method


    order_confirm = async (req, res) => {
        console.log("Calling order confirm")
        const {orderId} = req.params
        
        try {
            await customerOrderModel.findByIdAndUpdate(orderId, {payment_status: 'paid'})
            await authOrderModel.updateMany({orderId: new ObjectId(orderId)},{payment_status: 'paid', delivery_status: 'pending'})

            const custOrder = await customerOrderModel.findById(orderId)

            const authOrder = await authOrderModel.find({
                orderId: new ObjectId(orderId)
            })

            const time = moment(Date.now()).format('l')
            const splitTime = time.split('/')

            await myShopWallet.create({
                amount: custOrder.price,
                month: splitTime[0],
                year: splitTime[2]
            })

            for (let i = 0; i < authOrder.length; i++) {
               //for multiple sellers
               await sellerWallet.create({
                sellerId: authOrder[i].sellerId.toString(),
                amount: authOrder[i].price,
                month: splitTime[0],
                year: splitTime[2]
               }) 
            }

            responseRouter(res,200, {message: 'success'})
        } catch (error) {
            console.log(error.message)
        }
    }
    //END Method

}

module.exports = new orderController()