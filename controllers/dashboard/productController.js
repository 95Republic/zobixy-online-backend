const formidable = require("formidable")
const { responseRouter } = require("../../utilities/response")
const cloudinary = require('cloudinary').v2
const productModel = require('../../models/productModel')

class productController{

    add_product = async(req,res) => {
        const {id} = req
        const form = formidable({ multiples: true})

        form.parse(req, async(err, field, files) => {
            let{name,category,description,stock,price,discount,
                shopName,brand} = field;
            let {images} = files;
            name = name.trim()
            const slug = name.split(' ').join('-')

            //cloud connection
            cloudinary.config({
                cloud_name: process.env.cloud_name,
                api_key: process.env.api_key,
                api_secret: process.env.api_secret,
                secure: true
            })

            //cloudinary media upload
            try {

                let allImageUrl = [];

                if (!Array.isArray(images)) {
                    images = [images];
                }

                for (let i = 0; i < images.length; i++) {
                    const result = await cloudinary.uploader.upload(images[i].filepath, {folder: 'products'});
                    allImageUrl.push(result.url);
                    
                }


                //persisting data on db
                await productModel.create({
                    sellerId: id,
                    name,
                    slug,
                    shopName,
                    category: category.trim(),
                    description: description.trim(),
                    stock: parseInt(stock),
                    price: parseInt(price),
                    discount: parseInt(discount),
                    images: allImageUrl,
                    brand: brand.trim()
                })
                responseRouter(res, 201,{ message: 'Product added successfully!'})
                
            } catch (error) {
                console.log(error.message)
                responseRouter(res, 500,{ error: error.message})
            }

        })
    }

    /// end method


    products_get = async (req,res) => {
        const {page,searchValue,parPage} = req.query
        const {id} = req;

        const skipPage = parseInt(parPage) * (parseInt(page) -1 )


        try {

            if (searchValue) {
               
                const products = await productModel.find({
                    $text:  {$search: searchValue},
                    sellerId: id //seller id
                }).skip(skipPage).limit(parPage).sort({ createdAt: -1})

                const totalProduct = await productModel.find({
                    $text: {$search: searchValue},
                    sellerId: id //seller id
                }).countDocuments()
                responseRouter(res, 200,{ products,totalProduct})
                
            }else{
                const products = await productModel.find({ sellerId:id }).skip(skipPage).limit(parPage).sort({ createdAt: -1})

                const totalProduct = await productModel.find({ sellerId:id }).countDocuments()
                responseRouter(res, 200,{ products,totalProduct})
            }
            
        } catch (error) {
            console.log(error.message)
        }
    }

    /// end method




    product_get = async (req,res) => {
        const {productId} = req.params


        try {

            const product = await productModel.findById(productId)
            responseRouter(res, 200,{product})
            
        } catch (error) {
            console.log(error.message)
        }
    }

    /// end method



    product_update = async (req,res) => {
        let{name,discount,category,description,stock,price,brand,productId} = req.body; // getting field data from body
        name = name.trim()
        const slug = name.split(' ').join('-')

        try {

            await productModel.findByIdAndUpdate(productId, {
                name,discount,category,description,stock,price,brand, productId, slug
            })
            const product = await productModel.findById(productId)
            responseRouter(res, 200,{ product, message: 'Product Updated Successfully!'})
            
        } catch (error) {
            responseRouter(res, 500,{ error: error.message})
        }
    }

    ///end method

    product_image_update = async (req,res) => {
        const form = formidable({multiples: true})

        form.parse(req, async (err,field,files) => {
            const {oldImage,productId} = field;
            const {newImage} = files;
            
            if(err){
                responseRouter(res, 400,{ error: err.message})
            }else{

                try {
                    
                    //cloud connection
                    cloudinary.config({
                        cloud_name: process.env.cloud_name,
                        api_key: process.env.api_key,
                        api_secret: process.env.api_secret,
                        secure: true
                    })

                    //upload image 
                    const result = await cloudinary.uploader.upload(newImage.filepath, { folder: 'products' })

                    if (result) {
                        let {images} = await productModel.findById(productId)
                        const index = images.findIndex(img => img === oldImage)
                        images[index] = result.url;
                        await productModel.findByIdAndUpdate(productId, {images})

                        const product = await productModel.findById(productId)
                        responseRouter(res, 200,{ product, message: 'Product Image Updated Successfully!'})
                        
                    } else {

                        responseRouter(res, 404,{ error: 'Image Update Failed!'})
                        
                    }
                    
                } catch (error) {
                    responseRouter(res, 404,{error: error.message})
                    
                }
            }

        })
    }

    ///end method

}

module.exports = new productController()