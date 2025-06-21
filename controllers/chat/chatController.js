const sellerModel = require('../../models/sellerModel')
const customerModel = require('../../models/customerModel')
const sellerCustomerModel = require('../../models/chat/sellerCustomerModel')
const sellerCustomerMessageModel = require('../../models/chat/sellerCustomerMessage')
const adminSellerMessageModel = require('../../models/chat/adminSellerMessage')
const { responseRouter } = require("../../utilities/response")

class chatController {

    add_customer_friend = async (req, res) => {
        console.log("Calling add customer friend")
        const {sellerId, userId } = req.body

        try {
            if (sellerId !== '') {
                const seller = await sellerModel.findById(sellerId)
                const user = await customerModel.findById(userId)
                const checkSeller = await sellerCustomerModel.findOne({
                    $and: [
                        {
                            myId: {
                                $eq: userId
                            }
                        },{
                            myFriends: {
                                $elemMatch: {
                                    fdId: sellerId
                                }
                            }
                        }
                    ]
                })
                if (!checkSeller) {
                    await sellerCustomerModel.updateOne({
                        myId: userId
                    },{
                        $push: {
                            myFriends: {
                                fdId: sellerId,
                                name: seller.shopInfo?.shopName,
                                image: seller.image
                            }
                        }
                    })  
                }


                const checkCustomer = await sellerCustomerModel.findOne({
                    $and: [
                        {
                            myId: {
                                $eq: sellerId
                            }
                        },{
                            myFriends: {
                                $elemMatch: {
                                    fdId: userId
                                }
                            }
                        }
                    ]
                })
                if (!checkCustomer) {
                    await sellerCustomerModel.updateOne({
                        myId: sellerId
                    },{
                        $push: {
                            myFriends: {
                                fdId: userId,
                                name: user.name,
                                image: ""
                            }
                        }
                    })  
                }

                const messages = await sellerCustomerMessageModel.find({
                    $or: [
                        {
                            $and: [{
                                receiverId: {$eq: sellerId}
                            },{
                                senderId: {
                                    $eq: userId
                                }
                            }]
                        },
                        {
                            $and: [{
                                receiverId: {$eq: userId}
                            },{
                                senderId: {
                                    $eq: sellerId
                                }
                            }]
                        }
                    ]
                })

                const MyFriends = await sellerCustomerModel.findOne({
                    myId: userId
                })

                const currentFd = MyFriends.myFriends.find(s => s.fdId === sellerId)

                responseRouter(res, 200,{
                    MyFriends: MyFriends.myFriends,
                    currentFd,
                    messages
                })
            }else{
                const MyFriends = await sellerCustomerModel.findOne({
                    myId: userId
                })

                responseRouter(res, 200,{
                    MyFriends: MyFriends.myFriends
                })

            }
        } catch (error) {
            console.log("Oops! errror occured:")
            console.log(error)
        }
    }
    //End Method


    add_customer_message = async (req, res) => {
        console.log("Calling add customer message")
        const {userId,text,sellerId,name} = req.body 

        try {

            const message = await sellerCustomerMessageModel.create({
                senderId: userId,
                senderName: name,
                receiverId: sellerId,
                message: text
            })

            const data = await sellerCustomerModel.findOne({myId: userId })
            let myFriends = data.myFriends
            let index = myFriends.findIndex(f => f.fdId === sellerId)

            while (index > 0) {
                let temp = myFriends[index]
                myFriends[index] = myFriends[index -1]
                myFriends[index -1] = temp
                index-- 
            }

            await sellerCustomerModel.updateOne(
                {
                    myId: userId
                },
                {
                    myFriends
                }
            )




            const data1 = await sellerCustomerModel.findOne({myId: sellerId })
            let myFriends1 = data1.myFriends
            let index1 = myFriends1.findIndex(f => f.fdId === userId)

            while (index > 0) {
                let temp1 = myFriends1[index1]
                myFriends1[index1] = myFriends[index1 -1]
                myFriends1[index1 -1] = temp1
                index-- 
            }

            await sellerCustomerModel.updateOne(
                {
                    myId: sellerId
                },
                {
                    myFriends1
                }
            )

               responseRouter(res, 201,{message})
        } catch (error) {
            console.log("Oops! errror occured:")
            console.log(error)
        }
    }
    //End Method


    get_customers = async (req, res) => {
        console.log("Calling get customers")
        const {sellerId} = req.params

        try {

            const data = await sellerCustomerModel.findOne({
                myId: sellerId
            })
        

            responseRouter(res, 200,{
                customers: data.myFriends
            })
        } catch (error) {
            console.log("Oops! errror occured:")
            console.log(error)
        }
    }
    //End Method


    get_customer_message = async (req, res) => {
        console.log("Calling get customer message")
        const {customerId} = req.params
        const {id} = req

        try {

      const messages = await sellerCustomerMessageModel.find({
            $or: [
                {
                    $and: [{
                        receiverId: {$eq: customerId}
                    },{
                        senderId: {
                            $eq: id
                        }
                    }]
                },
                {
                    $and: [{
                        receiverId: {$eq: id}
                    },{
                        senderId: {
                            $eq: customerId
                        }
                    }]
                }
            ]
        })

        const currentCustomer = await customerModel.findById(customerId)
        responseRouter(res, 200,{
            messages,
            currentCustomer
        })

        } catch (error) {
            console.log("Oops! errror occured:")
            console.log(error)
        }
    }
    //End Method

    add_seller_message = async (req, res) => {
        console.log("Calling add seller message")
        const {receiverId,text,senderId,name} = req.body 

        try {

            const message = await sellerCustomerMessageModel.create({
                senderId: senderId,
                senderName: name,
                receiverId: receiverId,
                message: text
            })

            const data = await sellerCustomerModel.findOne({myId: senderId })
            let myFriends = data.myFriends
            let index = myFriends.findIndex(f => f.fdId === receiverId)

            while (index > 0) {
                let temp = myFriends[index]
                myFriends[index] = myFriends[index -1]
                myFriends[index -1] = temp
                index-- 
            }

            await sellerCustomerModel.updateOne(
                {
                    myId: senderId
                },
                {
                    myFriends
                }
            )




            const data1 = await sellerCustomerModel.findOne({myId: receiverId })
            let myFriends1 = data1.myFriends
            let index1 = myFriends1.findIndex(f => f.fdId === senderId)

            while (index > 0) {
                let temp1 = myFriends1[index1]
                myFriends1[index1] = myFriends[index1 -1]
                myFriends1[index1 -1] = temp1
                index-- 
            }

            await sellerCustomerModel.updateOne(
                {
                    myId: receiverId
                },
                {
                    myFriends1
                }
            )

               responseRouter(res, 201,{message})
        } catch (error) {
            console.log("Oops! errror occured:")
            console.log(error)
        }
    }
    //End Method


    get_sellers = async (req, res) => {
        console.log("Calling get sellers")
        try {

            const sellers = await sellerModel.find({})
        

            responseRouter(res, 200,{
                sellers
            })
        } catch (error) {
            console.log("Oops! errror occured:")
            console.log(error)
        }
    }
    //End Method


    seller_admin_message_send = async (req, res) => {
        console.log("Calling get seller admin message send")
        const {senderId,receiverId,message,senderName} = req.body
        try {

            const messageData = await adminSellerMessageModel.create({
                senderId,
                receiverId,
                message,
                senderName
            })
        

            responseRouter(res, 200,{message: messageData})
        } catch (error) {
            console.log("Oops! errror occured:")
            console.log(error)
        }
    }
    //End Method

    get_admin_messages = async (req, res) => {
        console.log("Calling get admin messages")
        const {receiverId} = req.params
        const id = ""

    try {

      const messages = await adminSellerMessageModel.find({
            $or: [
                {
                    $and: [{
                        receiverId: {$eq: receiverId}
                    },{
                        senderId: {
                            $eq: id
                        }
                    }]
                },
                {
                    $and: [{
                        receiverId: {$eq: id}
                    },{
                        senderId: {
                            $eq: receiverId
                        }
                    }]
                }
            ]
        })

        let currentSeller = {}
        if (receiverId){
            currentSeller = await sellerModel.findById(receiverId)
        }
        responseRouter(res, 200,{
            messages,
            currentSeller
        })

        } catch (error) {
            console.log("Oops! errror occured:")
            console.log(error)
        }
    }
    //End Method



    get_seller_messages = async (req, res) => {
        console.log("Calling get seller messages")
        const receiverId = ""
        const {id} = req

    try {

      const messages = await adminSellerMessageModel.find({
            $or: [
                {
                    $and: [{
                        receiverId: {$eq: receiverId}
                    },{
                        senderId: {
                            $eq: id
                        }
                    }]
                },
                {
                    $and: [{
                        receiverId: {$eq: id}
                    },{
                        senderId: {
                            $eq: receiverId
                        }
                    }]
                }
            ]
        })
        responseRouter(res, 200,{
            messages
        })

        } catch (error) {
            console.log("Oops! errror occured:")
            console.log(error)
        }
    }
    //End Method
    


}

module.exports = new chatController()