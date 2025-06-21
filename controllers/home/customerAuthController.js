const formidable = require("formidable")
const { responseRouter } = require("../../utilities/response")
const cloudinary = require('cloudinary').v2
const customerModel = require("../../models/customerModel")
const bcrypt = require('bcrypt')
const sellerCustomerModel = require("../../models/chat/sellerCustomerModel")
const { createToken } = require("../../utilities/tokenCreate")

class customerAuthController{


    customer_register = async (req,res) => {
        
        console.log("Calling customer register")
        const {name,email,password} = req.body
        try {
            const customer = await customerModel.findOne({email})

            if (customer) {
                responseRouter(res,404, {error: "Email Already Exists"})
                
            } else {
                const createCustomer = await customerModel.create({
                    name: name.trim(),
                    email: email.trim(),
                    password: await bcrypt.hash(password, 10),
                    method: 'manually'
                })
                await sellerCustomerModel.create({
                    myId: createCustomer.id
                })

                const token = await createToken({
                    id: createCustomer.id,
                    name: createCustomer.name,
                    email: createCustomer.email,
                    method: createCustomer.method
                })
                res.cookie('customerToken', token, {
                    expires : new Date(Date.now() + 7*24*60*60*1000)
                })

                responseRouter(res,200,{token,message: "Registration Successful!"})
                
            }
            
   
        } catch (error) {
            console.log(error.message)
            
        }


        
    }

    //END Method



    customer_login = async (req,res) => {
        
        console.log("Calling customer login")
        const {email,password} = req.body
        try {
            const customer = await customerModel.findOne({email}).select('+password')

            if (customer) {
                const match = await bcrypt.compare(password, customer.password)
                if (match) {
                    const token = await createToken({
                        id: customer.id,
                        name: customer.name,
                        email: customer.email,
                        method: customer.method
                    })
                    res.cookie('customerToken', token, {
                        expires : new Date(Date.now() + 7*24*60*60*1000)
                    })
                    responseRouter(res,200,{message: 'User Login Successfull!!!', token})
                } else {
                    responseRouter(res,404, {error: "User Email Or Password Wrong!!!"})
                }
                
                
            } else {

                responseRouter(res,404,{error: "User Email Not Found!!!"})
                
            }
            
   
        } catch (error) {
            console.log(error.message)
            
        }


        
    }

    //END Method




    customer_logout = async (req,res) => {
        
        console.log("Calling customer logout")

        res.cookie('customerToken', "",{
            expires: new Date(Date.now())
        })
        
        responseRouter(res,200,{message: 'User Logout Successfull!!!'})
    
        
    }

    //END Method
    


}

module.exports = new customerAuthController()