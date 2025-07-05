const adminModel = require('../models/adminModel')
const sellerModel = require('../models/sellerModel')
const sellerCustomerModel = require('../models/chat/sellerCustomerModel')

const { responseRouter } = require('../utilities/response')
const bcrpty = require('bcrypt')
const { createToken } = require('../utilities/tokenCreate')

const formidable = require("formidable")
const cloudinary = require('cloudinary').v2

class authControllers{

    admin_login = async(req,res) => {
        const {email,password} = req.body
        console.log(req.body)
        try {
            const admin = await adminModel.findOne({email}).select('+password')
            if(admin){
                const match = await bcrpty.compare(password, admin.password)
                console.log(match)
                if (match) {

                    //generate cookies if email and password match
                    const token = await createToken({
                        id : admin.id,
                        role : admin.role
                    })

                    //adding created token to the cookies
                    res.cookie('accessToken',token, {
                        httpOnly: true,
                        secure: true,
                        sameSite: 'none',
                        maxAge: 7 * 24 * 60 * 60 * 1000
                    })
                    
                    responseRouter(res,200,{token,message: "Login Success"})
                } else {
                    console.log('INSIDE PASS WORD DOSNT MATCh')
                    responseRouter(res,404,{error: "User password does not match email"})
                }
            }else{
                responseRouter(res,404,{error: "User email not found"})

            }
            
        } catch (error) {
            responseRouter(res,500,{error: error.message})
            
        }
 
    }

    // END METHOD


    //seller registration----------------------------

    seller_register = async(req, res) => {
        const {name,email,password} = req.body //get elements from body

        try {

            const getUser = await sellerModel.findOne({email}) //query db if user email exists
            if (getUser) {
                console.log(getUser)
                //if the user exists in db show error message
                responseRouter(res,404,{error: 'User Email Already Exists'})  
            }else{
            
            //store data in db
            const seller = await sellerModel.create({
                name,
                email,
                password: await bcrpty.hash(password, 10),
                method: 'manual_registration',
                shopInfo: {}
            })
            //adding seller ID to sellerCustomer model
            await sellerCustomerModel.create({
                myId: seller.id
            })

            // generate jwt token by seller ID and Role
            const token = await createToken({
                id : seller.id,
                role: seller.role
            })
            res.cookie('accessToken', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 7 * 24 * 60 * 60 * 1000 //expires within 7 days
            })

            responseRouter(res,201,{token,message: 'Registration Successful'})  
            }
        } catch (error) {
            responseRouter(res,500,{error: 'Internal Server Error'})  
        }

    }

    //END selller registration------------------------------



    //Seller Login------------------------------

    seller_login = async(req,res) => {
        const {email,password} = req.body //email and password from body 

        try {
            const seller = await sellerModel.findOne({email}).select('+password')
            if(seller){
                const match = await bcrpty.compare(password, seller.password)
                // console.log(match)
                if (match) {

                    //generate cookies if email and password match
                    const token = await createToken({
                        id : seller.id,
                        role : seller.role
                    })

                    //adding created token to the cookies
                    res.cookie('accessToken',token, {
                        expires : new Date(Date.now() + 7*24*60*60*1000)
                    })
                    
                    responseRouter(res,200,{token,message: "Login Success"})
                } else {
                    console.log('INSIDE PASS WORD DOSNT MATCh')
                    responseRouter(res,404,{error: "User password does not match email"})
                }
            }else{
                responseRouter(res,404,{error: "User email not found"})

            }
            
        } catch (error) {
            responseRouter(res,500,{error: error.message})
            
        }
 
    }
    //Seller Login end--------------------------


    //GET USER STAT METHOD
    getUser = async (req,res) => {
        const {id,role} = req;

        try {
            if (role === 'admin') {
                const user = await adminModel.findById(id)
                //get the logged in user data 
                responseRouter(res, 200, {userInfo : user})
                
            }else{
                const seller = await sellerModel.findById(id)
                //get the logged in user data 
                responseRouter(res, 200, {userInfo : seller})
            }
            
        } catch (error) {
            responseRouter(res,500,{error: 'Internal Server Error'})
            
        }

    } //End METHOD


    profile_image_upload = async(req,res) => {
        const {id} = req
        const form = formidable({ multiples: true})
        form.parse(req, async(err,_,files) => {
            
            //cloud connection
            cloudinary.config({
            cloud_name: process.env.cloud_name,
            api_key: process.env.api_key,
            api_secret: process.env.api_secret,
            secure: true
            })
            const {image} = files


            try {
            //upload image 
            const result = await cloudinary.uploader.upload(image.filepath, { folder: 'profile' })
            if (result) {
                await sellerModel.findByIdAndUpdate(id, {image: result.url})
                const userInfo = await sellerModel.findById(id)
                responseRouter(res, 200, {message: 'Profile Image Updated Successfully!', userInfo})
                
            }else{
                responseRouter(res, 404, {error : 'Image Upload Failed!'})
            }
                
            } catch (error) {
                responseRouter(res, 500, {error : error.message})
            }



        })
    }
    ///end method


    //profile info add----------------------------

    profile_info_add = async(req, res) => {
        const {division,district,shopName,sub_district} = req.body; //get elements from body
        const {id} = req;

        try {

            await sellerModel.findByIdAndUpdate(id, {
                shopInfo: {
                    shopName,
                    division,
                    district,
                    sub_district
                }
            }) 

            const userInfo = await sellerModel.findById(id)

            responseRouter(res,200,{message: 'Profile Info Added Successfully!', userInfo})  
            
        } catch (error) {
            responseRouter(res,500,{error: error.message})  
        }

    }

    //END profile info add------------------------------


change_password = async (req, res) => {
    console.log("Calling change password");
    const { email, old_password, new_password } = req.body;
    try {
        // 1. Find user (with password field)
        const user = await sellerModel.findOne({ email }).select('+password');

        if (!user) {
            return responseRouter(res, 404, { message: 'User not found!' }); // Return to stop execution
        }

        // 2. Check if old password matches
        const isMatch = await bcrpty.compare(old_password, user.password);

        if (!isMatch) {
            return responseRouter(res, 400, { message: 'Invalid password. Old password does not match!' }); // Return to stop execution
        }

        // 3. Update password & save
        user.password = await bcrpty.hash(new_password, 10);
        await user.save();

        // 4. Success response
        return responseRouter(res, 200, { message: 'Password changed successfully!' });

    } catch (error) {
        console.error("Error in change_password:", error);
        return responseRouter(res, 500, { error: 'Internal Server Error' });
    }
};

//END Method

    logout = async (req,res) => {
        try {

            res.cookie('accessToken', null, {
                expires: new Date(Date.now()),
                httpOnly: true
            })
        
            responseRouter(res, 200, {message : 'Logout Successful'})
            
            
        } catch (error) {
            responseRouter(res,500,{error: 'Internal Server Error'})
            
        }

    } //End METHOD
}

module.exports = new authControllers()