const formidable = require("formidable")
const { responseRouter } = require("../../utilities/response")
const cloudinary = require('cloudinary').v2
const categoryModel = require('../../models/categoryModel')

class categoryController{

    add_category = async (req,res) => {

        //get form data 
        const form = formidable()
        form.parse(req, async(err,fields,files) => {
            if (err) {
                responseRouter(res, 404,{ error: 'Something went wrong'})
                
            } else {
                let {name} = fields
                let {image} = files
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

                    const result = await cloudinary.uploader.upload(image.filepath, {folder: 'categorys'})
                    if (result) {
                        const category = await categoryModel.create({
                            name,
                            slug,
                            image: result.url
                        })
                        responseRouter(res, 201,{ category,message: 'Category added successfully!'})
                        
                    } else {
                        responseRouter(res, 404,{ error: 'Image upload failed'})
                        
                    }
                    
                } catch (error) {
                    responseRouter(res, 500,{ error: 'Internal Server Error'})
                }
                
            }
        })
        
    }

    //End Method

    get_category = async (req,res) => {
        
        const {page,searchValue, parPage} = req.query //getting input data from query
        
        console.log(req.query)
        try {
            let skipPage = ''
            if (parPage && page) {
                skipPage = parseInt(parPage) * (parseInt(page) -1 )
            }



            if (searchValue && page && parPage) {
                console.log('has search value')
                const categorys = await categoryModel.find({
                    $text:  {$search: searchValue}
                }).skip(skipPage).limit(parPage).sort({ createdAt: -1})

                const totalCategory = await categoryModel.find({
                    $text: {$search: searchValue}
                }).countDocuments()
                responseRouter(res, 200,{ categorys,totalCategory})
                
            } else if(searchValue === '' && page && parPage){

                const categorys = await categoryModel.find({ }).skip(skipPage).limit(parPage).sort({ createdAt: -1})

                const totalCategory = await categoryModel.find({ }).countDocuments()
                responseRouter(res, 200,{ categorys,totalCategory})


            }else {
               
                const categorys = await categoryModel.find({ }).sort({ createdAt: -1})
                const totalCategory = await categoryModel.find({ }).countDocuments()
                responseRouter(res, 200,{ categorys,totalCategory})
                
            }
        } catch (error) {
            console.log(error.message)
            
        }


        
    }

    //END Method




    update_category = async (req,res) => {
        console.log("Calling update category")
        
        const form = formidable()
        form.parse(req, async(err,fields,files) => {
            if (err) {
                responseRouter(res, 404,{ error: 'Something went wrong'})
                
            } else {
                let {name} = fields
                let {image} = files
                const {id} = req.params

                name = name.trim()
                const slug = name.split(' ').join('-') 

        try {
            let result = null
            if (image) {
                //cloud connection
                cloudinary.config({
                    cloud_name: process.env.cloud_name,
                    api_key: process.env.api_key,
                    api_secret: process.env.api_secret,
                    secure: true
                });
                result = await cloudinary.uploader.upload(image.filepath, {folder: 'categorys'})
            }

            const updateData = {
                name,
                slug,
            }

            if(result){
                updateData.image = result.url;
            }

            const category = await categoryModel.findByIdAndUpdate(id, updateData,{new:true})

            responseRouter(res, 200,{ category,message: 'Category updated successfully!'})
            
        } catch (error) {
            responseRouter(res, 500,{ error: 'Internal Server Error'})
        }
                
    }
})

}
//END Method




delete_category = async (req,res) => {
    console.log("Calling delete category")
    console.log(req.params.id)
    try {
        const categoryId = req.params.id
        const deleteCategory = await categoryModel.findByIdAndDelete(categoryId)
        if(!deleteCategory){
            console.log(`Category with id ${categoryId} not found`)
            return res.status(404).json({message: 'Category not found'})
        }

        return res.status(200).json({message: 'Category succesfully deleted!!'})
            
    } catch (error) {
        console.log(error)
        return res.status(500).json({message: 'Internal Server error'})
    }
                
}
//END Method

}

module.exports = new categoryController()