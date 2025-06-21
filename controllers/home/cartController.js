const { responseRouter } = require("../../utilities/response")
const wishlistModel = require("../../models/wishlistModel")
const cartModel = require("../../models/cartModel")
const { mongo: {ObjectId} } = require('mongoose')

class cartController{


    add_to_cart = async (req,res) => {
        
        console.log("Calling add to cart")
        const {userId,quantity,productId} = req.body
        try {
            const product = await cartModel.findOne({
                $and: [{
                    productId : {
                       $eq: productId 
                    }
                },
                {
                    userId: {
                       $eq: userId 
                    }
                }
            ]
            })

            if (product) {
                responseRouter(res,404, {error: "Product Already Added To Cart!!!"})
                
            } else {

                const product = await cartModel.create({
                    userId,
                    productId,
                    quantity
                })
                responseRouter(res,200, {message: "Product Added To Cart Successfully",product})
                
            }
            
            

        } catch (error) {
            console.log(error.message)
            
        }
        
    }

    //END Method


    get_cart_products = async (req,res) => {
    
        const commission = 5; //5% commission 
        const {userId} = req.params
        try {
            const cart_products = await cartModel.aggregate([{
                $match: {
                    userId: {
                        $eq: new ObjectId(userId)
                    }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'productId',
                    foreignField: "_id",
                    as: 'products'
                }
            }
        ])

        let buy_product_item = 0;
        let calculatePrice = 0;
        let cart_product_count = 0;
        const outOfStockProduct = cart_products.filter(p => p.products[0].stock < p.quantity)

        // out of stock product count
        for (let i = 0; i < outOfStockProduct.length; i++) {
            cart_product_count = cart_product_count + outOfStockProduct[i].quantity
            
        }

        const stockProduct = cart_products.filter(p => p.products[0].stock >= p.quantity)

        for (let i = 0; i < stockProduct.length; i++) {
            const {quantity} = stockProduct[i]
            cart_product_count = buy_product_item + quantity

            buy_product_item = buy_product_item + quantity

            const {price, discount} = stockProduct[i].products[0]
            if (discount !== 0) {
                calculatePrice = calculatePrice + quantity * (price - Math.floor((price * discount) / 100))
                
            } else {
                calculatePrice = calculatePrice + quantity * price
                
            }
            
        } //end for loop

        let p = []
        let unique = [...new Set(stockProduct.map(p => p.products[0].sellerId.toString()))]
        for (let i = 0; i < unique.length; i++) {
            let price = 0;
            for (let j = 0; j < stockProduct.length; j++) {
                const tempProduct = stockProduct[j].products[0]
                if (unique[i] == tempProduct.sellerId.toString()) {
                    let pri = 0;
                    
                    if (tempProduct.discount !== 0) {
                        pri = tempProduct.price - Math.floor((tempProduct.price * tempProduct.discount) / 100)
                        
                    } else {
                        pri = tempProduct.price
                    }

                    // calculating commission
                    pri = pri - Math.floor((pri * commission) / 100)
                    price = price + pri * stockProduct[j].quantity

                    p[i] = {
                        sellerId: unique[i],
                        shopName: tempProduct.shopName,
                        price,
                        products: p[i] ? [...p[i].products,
                        {
                            _id: stockProduct[j]._id,
                            quantity: stockProduct[j].quantity,
                            productInfo: tempProduct
                        }
                    ] : [{
                            _id: stockProduct[j]._id,
                            quantity: stockProduct[j].quantity,
                            productInfo: tempProduct

                    }]
                    }
                }
                
            }
            
        }
            
        responseRouter(res,200,{
            cart_products: p,
            price: calculatePrice,
            cart_product_count,
            shipping_fee: 20 * p.length,
            outOfStockProduct,
            buy_product_item
        })

        } catch (error) {
            console.log(error.message)
            
        }
        
    }

    //END Method



    delete_cart_product = async (req,res) => {
        
        console.log("Calling delete cart product")
        const {cart_id} = req.params
        try {
            await cartModel.findByIdAndDelete(cart_id)
            responseRouter(res,200, {message: "Product Removed From Cart Successfully"})
        } catch (error) {
            console.log(error.message)
            
        }
        
    }

    //END Method


    quantity_inc = async (req,res) => {
        
        console.log("Calling quantity increment")
        const {cart_id} = req.params
        try {
            const product = await cartModel.findById(cart_id)
            const {quantity} = product
            await cartModel.findByIdAndUpdate(cart_id,{quantity: quantity + 1})
            responseRouter(res,200, {message: "Quantity Updated Successfully"})
        } catch (error) {
            console.log(error.message)
            
        }
        
    }

    //END Method

    quantity_dec = async (req,res) => {
        
        console.log("Calling quantity decrement")
        const {cart_id} = req.params
        try {
            const product = await cartModel.findById(cart_id)
            const {quantity} = product
            await cartModel.findByIdAndUpdate(cart_id,{quantity: quantity - 1})
            responseRouter(res,200, {message: "Quantity Updated Successfully"})
        } catch (error) {
            console.log(error.message)
            
        }
        
    }

    //END Method



    add_to_wishlist = async (req,res) => {
        
        console.log("Calling add to wishlist")
        const {slug} = req.body
        try {

            const product = await wishlistModel.findOne({slug})
            if (product) {

                responseRouter(res,404, {error: "Product Already Exists in wishlist"})
                
            } else {
                
                await wishlistModel.create(req.body)
                responseRouter(res,201, {message: "Product Added to Wishlist Successfully"})
            }
            
        } catch (error) {
            console.log(error.message)
            
        }
        
    }

    //END Method
    
    
    
    get_wishlist_products = async (req,res) => {
        
        console.log("Calling get wishlist products")
        console.log(req.params)
        const {userId} = req.params
        try {

            const wishlists = await wishlistModel.find({userId})
            responseRouter(res,200, {wishlistCount: wishlists.length,
                wishlists
            })
            
        } catch (error) {
            console.log(error.message)
            
        }
        
    }

    //END Method


    delete_product_from_wishlist = async (req,res) => {
        
        console.log("Calling delete wishlist product")
        const {wishlistId} = req.params
        try {
            await wishlistModel.findByIdAndDelete(wishlistId)
            responseRouter(res,200, {message: "Wishlist Product Removed Successfully", wishlistId})
        } catch (error) {
            console.log(error.message)
            
        }
        
    }

    //END Method
}

module.exports = new cartController()