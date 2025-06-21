const { responseRouter } = require("../../utilities/response")
const { mongo: {ObjectId} } = require('mongoose')
const categoryModel = require('../../models/categoryModel')
const productModel = require('../../models/productModel')
const reviewModel = require('../../models/reviewModel')
const queryProducts = require('../../utilities/queryProducts')
const moment = require("moment")

class homeController{


    formatedProduct = (products) => {
        const productArray = [];
        let i = 0;
        while (i < products.length) {
            let temp = []
            let j = i
            while (j < i + 3) {
                if (products[j]) {
                    temp.push(products[j])
                    
                }
                j++
            }
            productArray.push([...temp])
            i = j
        }
        return productArray

    }

    get_categorys = async (req,res) => {
        

        
        console.log("Calling get categorys")
        try {
            const categorys = await categoryModel.find({})
            responseRouter(res,200, {categorys})
   
        } catch (error) {
            console.log(error.message)
            
        }


        
    }

    //END Method




    get_products = async (req,res) => {
        
        console.log("Calling get products")
        try {
            const products = await productModel.find({}).limit(12).sort({
                createdAt: -1 //ascending -1 descending 1
            })

            const allProducts1 = await productModel.find({}).limit(9).sort({
                createdAt: -1 //ascending -1 descending 1
            })

            const latestProducts = this.formatedProduct(allProducts1)
            const allProducts2 = await productModel.find({}).limit(9).sort({
                rating: -1 //ascending -1 descending 1
            })


            const topRatedProducts = this.formatedProduct(allProducts2)
            const allProducts3 = await productModel.find({}).limit(9).sort({
                discount: -1 //ascending -1 descending 1
            })

            const discountedProducts = this.formatedProduct(allProducts3)
            console.log("Products: " + products.length + " latest products: " + latestProducts.length + " top rated products: " + topRatedProducts.length + " discounted products: " + discountedProducts.length)

            responseRouter(res,200, {
                products,
                latestProducts,
                topRatedProducts,
                discountedProducts
            })
   
        } catch (error) {
            console.log(error.message)
            
        }
        
    }

    //END Method



    get_price_range_latest_product = async (req,res) => {
        
        console.log("Calling get price range for products")
        try {
            const priceRange = {
                low: 0,
                high: 0,
            }

            const products = await productModel.find({}).limit(9).sort({
                createdAt: -1
            })
            const latestProducts = this.formatedProduct(products);
            const getByPrice = await productModel.find({}).sort({
                'price': 1
            })

            if (getByPrice.length > 0) {
                priceRange.high = getByPrice[getByPrice.length - 1].price //last index price
                priceRange.low = getByPrice[0].price //first index price
                
            }
            responseRouter(res,200, {
                latestProducts,
                priceRange
            })

   
        } catch (error) {
            console.log(error.message)
            
        }
        
    }

    //END Method


    query_products = async (req,res) => {
        
        console.log("Calling query products")
        const parPage = 12
        req.query.parPage = parPage
        // console.log(req.query)
        try {
            const products = await productModel.find({}).sort({
                createdAt: -1
            })
            
            const totalProduct = new queryProducts(products, req.query).categoryQuery().ratingQuery().searchQuery().priceQuery().sortByPrice().countProducts();
            
            const result = new queryProducts(products, req.query).categoryQuery().ratingQuery().priceQuery().searchQuery().sortByPrice().skip().limit().getProducts();
        
            responseRouter(res, 200, {
                products: result,
                totalProduct,
                parPage
            })
    
            
        } catch (error) {
            console.log(error.message)
        }
        
    }

    //END Method
    

    get_product_details = async (req,res) => {
        
        console.log("Calling get product details")
        const {slug} = req.params
        try {

            const product = await productModel.findOne({slug})


            const relatedProducts = await productModel.find({
                $and: [{
                    _id: {
                        $ne: product.id
                    }
                },
                {
                    category: {
                        $eq: product.category
                    }
                }
            ]
            }).limit(12)


            const moreProducts = await productModel.find({
                $and: [{
                    _id: {
                        $ne: product.id
                    }
                },
                {
                    sellerId: {
                        $eq: product.sellerId
                    }
                }
            ]
            }).limit(3)



            responseRouter(res, 200, {
                product,
                relatedProducts,
                moreProducts
            })
    
            
        } catch (error) {
            console.log(error.message)
        }
        
    }

    //END Method


    submit_review = async (req,res) => {
        console.log("Calling submit a review")
        let counter = 0
        counter = counter +1
        // console.log("Calling submit review" + counter)
        const {productId, rating, review, name} = req.body
        try {

            await reviewModel.create({
                productId,
                name,
                rating,
                review,
                date: moment(Date.now()).format('LL')
            })

            let rat = 0;
            const reviews = await reviewModel.find({
                productId
            })

            for (let i = 0; i < reviews.length; i++) {
               rat = rat + reviews[i].rating 
            }
            
            let productRating = 0
            if (reviews.length !== 0) {

                productRating = (rat / reviews.length).toFixed(1)
            }

            await productModel.findByIdAndUpdate(productId,{
                rating: productRating
            })


            responseRouter(res, 200, {message: "Review Added Successfully"})
    
            
        } catch (error) {
            console.log(error.message)
        }
        
    }

    //END Method


    get_reviews = async (req, res) => {
        console.log("Calling get reviews")
        try {
          const { productId } = req.params;
          let { pageNo } = req.query;
          pageNo = parseInt(pageNo) || 1; // Default to page 1 if undefined or invalid
      
          const limit = 5;
          const skipPage = limit * (pageNo - 1);
      
          // Aggregate Ratings
          let getRating = await reviewModel.aggregate([
            {
              $match: {
                productId: new ObjectId(productId),
                rating: { $gte: 1 }, // Ensuring valid ratings
              },
            },
            {
              $group: {
                _id: "$rating",
                count: { $sum: 1 },
              },
            },
          ]);
      
          // Initialize Rating Summary
          let rating_review = [5, 4, 3, 2, 1].map((rating) => ({
            rating,
            sum: getRating.find((r) => r._id === rating)?.count || 0,
          }));
      
          // Fetch Reviews with Pagination
          const totalReview = await reviewModel.countDocuments({ productId });
          const reviews = await reviewModel
            .find({ productId })
            .skip(skipPage)
            .limit(limit)
            .sort({ createdAt: -1 });
      
          // Send Response
          res.status(200).json({
            reviews,
            totalReview,
            rating_review,
          });
        } catch (error) {
          console.error("Error fetching reviews:", error.message);
          res.status(500).json({ message: "Internal server error" });
        }
    }
        //End method


    


}

module.exports = new homeController()