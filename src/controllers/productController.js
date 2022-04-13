const validator = require('../middleware/validator')
const aws = require('../middleware/aws')
const productModel = require('../model/productModel')
const ObjectId = require('mongoose').Types.ObjectId;



// //creating product by validating all details.
// const productCreation = async function(req, res) {
//     try {
//         let files = req.files;
//         let requestBody = req.body;
        

//         //-----------------------validating empty req body.
//         if (!validator.isValidRequestBody(requestBody)) {
//             return res.status(400).send({ status: false, message: "Please provide valid request body" })
//         }

//         //-----------------------extract params for request body.
//         let {
//             title,
//             description,
//             price,
//             currencyId,
//             currencyFormat,
//             isFreeShipping,
//             style,
//             availableSizes,
//             installments
//         } = requestBody

//         //-----------------------validation for the params starts.----------------------
//         if (!validator.isValid(title)) {
//             return res.status(400).send({ status: false, message: "Title is required" })
//         }

//         //------------------------uploading product image to AWS.------------------------
//         if (files) {
//             if (validator.isValidRequestBody(files)) {
//                 if (!(files && files.length > 0)) {
//                     return res.status(400).send({ status: false, message: "Please provide product image" })
//                 }
                
//             }
//         }

//         let productImage = await aws.uploadFile(files[0]);

//         //-----------------------object destructuring for response body.------------------------
//         const newProductData = {
//             title,
//             description,
//             price,
//             currencyId,
//             currencyFormat: currencyFormat,
//             isFreeShipping,
//             style,
//             availableSizes,
//             installments,
//             productImage: productImage
//         }
//         const saveProductDetails = await productModel.create(newProductData)
//         return res.status(201).send({ status: true, message: "Product added successfully.", data: saveProductDetails })

//     } catch (err) {
//         console.log(err)
//         return res.status(500).send({
//             status: false,
//             message: "Error is : " + err
//         })
//     }
// }



const createProduct = async (req, res) => {
    try {

        //Checking if no data is present in our request body
        let data = req.body
        if (!validator.isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Please enter details of product" })
        }

        //Checking if user has entered these mandatory fields or not
        const { title, description, price, currencyId, currencyFormat, productImage, availableSizes, style, installments } = data

        if (!validator.isValid(title)) {
            return res.status(400).send({ status: false, message: "title is required" })
        }
        let uniqueTitle = await productModel.findOne({ title: title })
        if (uniqueTitle) {
            return res.status(400).send({ status: false, message: "Title already exists" })
        }

        if (!validator.isValid(description)) {
            return res.status(400).send({ status: false, message: "description is required" })
        }


        if (!validator.isValid(price)) {
            return res.status(400).send({ status: false, message: "price is required" })
        }
        // if (!/^\d+(?:\.\d{1,2})?$/.test(price)) {
        //     return res.status(400).send({ status: false, message: "Enter valid price" })
        // }

        if (!validator.isValid(currencyId)) {
            return res.status(400).send({ status: false, message: "currencyId is required" })
        }

        if (!validator.isValid(currencyFormat)) {
            return res.status(400).send({ status: false, message: "currencyFormat is required" })
        }


        let files = req.files
        if (files && files.length > 0) {
            let uploadedFileURL = await aws.uploadFile(files[0])
            data['productImage'] = uploadedFileURL
        }
        else {
            return res.status(400).send({ status: false, message: "productImage is required" })
        }

        if (!validator.isValidateSize(availableSizes)) {
            return res.status(400).send({ status: false, message: "Availablesize atleast one of the size in S, XS, M, X, L, XXL, XL" })
        }

        let productData = {
            title,
            description,
            price,
            currencyId,
            currencyFormat,
            productImage: data.productImage,
            style,
            availableSizes,
            installments
        }

        let productDetails = await productModel.create(productData)
        return res.status(201).send({ status: true, message: "Success", data: productDetails })
    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: error.message })
    }
}


//----------------------------------------2nd api--------------------------------------------------------------------------------------------

const getproductsById=async function(req,res){

    try {
        let productId=req.params.productId
        if(!validator.isValidObjectId(productId)){
            return res.status(400).send({status:false,msg:"product it is not valid"})
        }
        const getproducts=await productModel.findById({_id:productId})
        if(!getproducts){
            return res.status(404).send({status:false,msg:"this product are not avilable"})
        }
        if(getproducts.isDeleted==false){
            return res.status(200).send({status:false,msg:"got data",data:getproducts})
        }
        
    } catch (error) {
        return res.status(500).send({status:false,msg:error.message})
        
    }
}


//-----------------------------------------3rd api-----------------------------------------------------------------------------------------


const deleteproductById=async function(req,res){
    try {
        let productId=req.params.productId
        if(!isValidObjectId(productId)){
            return res.status(400).send({status:false,msg:"need valid productid"})
        }
        const productwithId=await productModel.findById({_id:productId})
        if(!productwithId){
            return res.status(404).send({status:false,msg:"not able to found"})
        }
        if(productwithId.isDeleted==true){
            return res.status(400).send({status:false,msg:"product already deleted"})
        }

        const productdelete=await productModel.findByIdAndUpdate({_id:productId},{$set:{isDeleted:true,deletedAt:new Date()}},{new:true})
        return res.status(400).send({status:true,msg:"deleted sucessfully",data:productdelete})
        
    } catch (error) {
        return res.status(500).send({status:false,msg:error.message})
        
    }

}



//-----------------------------------4th api-----------------------------------------------------





const updateProduct = async function(req,res){
    try {

        const productId = req.params.productId

        const {description, title, isFreeShipping, price, style,availableSizes, installments } = req.body

        if (!validator.isValidRequestBody(req.body)) {
            return res.status(400).send({
              status: false,
              message: "Bad Request there is no data in input field",
            });
          }
          if (!productId) {
            return res.status(400).send({
              status: false,
              msg: "productId is must please provide productId ",
            });
          }


          if (!validator.isValidObjectId(productId)) {
            return res
              .status(400)
              .send({ status: false, message: "Invalid productId" });
          }

          let productPresent = await productModel.findOne({
            _id: productId,
            isDeleted: false,
          });
          if (!productPresent) {
            return res
              .status(404)
              .send({ status: false, message: `product with this id : ${productId} not found`});
          }
      





          if (title) {

            if(!validator.isValid(title)){
                return res.status(400).send({status:false, message:"Bad request please provoide valid title"})
            }

            const isTitleExists = await productModel.find({
              title: { $regex: title, $options: "i" },
              isDeleted: false,
            });
      
      
            const exactTitleMatch = [];
            for (let i = 0; i < isTitleExists.length; i++) {
      
              const str1 = isTitleExists[i].title;
              const str2 = title;
      
              if (str1.toLowerCase() === str2.toLowerCase()) {
                exactTitleMatch.push(str1);
              }
      
            }
      
      
            if (exactTitleMatch.length) {
              return res
                .status(409)
                .send({
                  status: false,
                  message: `Bad Request this title: "${title}" is already exists with "${exactTitleMatch[0]}" this name`,
                });
            }
          }
      
      
          if(isFreeShipping){
            if(!validator.isValid(isFreeShipping)){
                return res.status(400).send({status:false, message:"Bad request please provoide valid isFreeShipping it only accept true or false value"})
            }


            // if(!validator.isValid(isFreeShipping) || isFreeShipping != "true" || isFreeShipping != "false"  ){
            //     return res.status(400).send({status:false, message:"Bad request please provoide valid isFreeShipping it only accept true or false value"})
            // }

          }
      

          if(price){
             // check price validation
             //only accept digit

            
             if(!validator.isValid(price)){
                return res.status(400).send({status:false, message:"Bad request please provoide valid price"})
            }
            // if(!validator.isValidPrice(price)){
            //     return res.status(400).send({status:false, message:"Bad request please provoide valid price only in digits"})
            // }

          }
      

          if(description){

            if(!validator.isValid(description)){
                return res.status(400).send({status:false, message:"Bad request please provoide valid description"})
            }
        }
          

        if(style){

            if(!validator.isValid(style)){
                return res.status(400).send({status:false, message:"Bad request please provoide valid style"})
            }
        }
          
        if(availableSizes){

            if(!validator.isValid(availableSizes)){
                return res.status(400).send({status:false, message:"Bad request please provoide valid availableSizes"})
            }
            const isSize = validator.isValidateSize(availableSizes)
            if(isSize != true){
                return res.status(400).send({status:false, message:`Bad requestfor size ${isSize} please provoide valid availableSizes from ["S", "XS","M","X", "L","XXL", "XL"]`})
          
            }
        }
        //installment validation

        if(installments){
            if(!validator.isValid(installments)){
                return res.status(400).send({status:false, message:"Bad request please provoide valid installments number"})
            }

        }
//************ */
      //  const updateProduct = await



        let uploadedFileURL;

        let files = req.files // file is the array

        if (files && files.length > 0) {

        uploadedFileURL = await aws.uploadFile(files[0])

        if(uploadedFileURL){
            req.body.productImage = uploadedFileURL
        } else{
            return res.status(400).send({status:false, message:"error uploadedFileURL is not present"})
        }

        }
        
    } catch (error) {
        return res.status(500).send({status:false, message:error.message})
    }
}








module.exports = {
    //productCreation,
    createProduct,
    getproductsById,
    deleteproductById,
    updateProduct
    
}