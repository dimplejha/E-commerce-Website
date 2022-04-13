const validator = require('../middleware/validator')
const aws = require('../middleware/aws')
const productModel = require('../model/productModel')
const ObjectId = require('mongoose').Types.ObjectId;




//--------------------------------------------1st api---------------------------------------------------------------------

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
        if (!/^\d+(?:\.\d{1,2})?$/.test(price)) {
            return res.status(400).send({ status: false, message: "Enter valid price" })
        }

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


const gettingProduct = async function (req, res) {
    try {


        let { size, name, priceGreaterThan, priceLessThan, priceSort } = req.query


        let filters = { isDeleted: false }

        if (size != null) {
            if (!validator.validEnum(size)) {
                return res.status(400).send({ status: false, msg: ' Select only  from ["S", "XS", "M", "X", "L", "XXL", "XL"]' })
            }
            filters["availableSizes"] = size
        }

        let arr = []

        if (name != null) {

            const data = await productModel.find({ isDeleted: false }).select({ title: 1, _id: 0 })
            for (let i = 0; i < data.length; i++) {
                var checkTitle = data[i].title

                let check = checkTitle.includes(name)
                if (check) {
                    arr.push(data[i].title)
                }

            }
            filters["title"] = arr

        }
        if (priceGreaterThan != null && priceLessThan == null) {
            filters["price"] = { $gt: priceGreaterThan }
        }


        if (priceGreaterThan == null && priceLessThan != null) {
            filters["price"] = { $lt: priceLessThan }
        }

        if (priceGreaterThan != null && priceLessThan != null) {
            filters["price"] = { $gte: priceGreaterThan, $lte: priceLessThan }
        }

        if (priceSort != null) {
            if (priceSort == 1) {
                const products = await productModel.find(filters).sort({ price: 1 })
                if (products.length == 0) {
                    return res.status(404).send({ status: false, message: "No match found" })
                }
                return res.status(200).send({ status: true, msg: "Success", data: products })
            }

            if (priceSort == -1) {
                const products = await productModel.find(filters).sort({ price: -1 })
                if (products.length == 0) {
                    return res.status(404).send({ status: false, message: "No match found" })
                }
                return res.status(200).send({ status: true, message: "Success",data: products })
            }

        }

        const products = await productModel.find(filters)
        if (products.length == 0) {
            return res.status(404).send({ status: false, message: "No match found" })
        }
        return res.status(200).send({ status: true, message: "Success",data: products })


    }catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: error.message })
    }

}



//-----------------------------------3th api-----------------------------------------------------

const getproductsById=async function(req,res){

    try {
        let productId=req.params.productId
        if(!isValidObjectId(productId)){
            return res.status(400).send({status:false,msg:"product it is not valid"})
        }
        const getproducts=await productModel.findById({_id:productId})
        if(!getproducts){
            return res.status(404).send({status:false,msg:"this product are not avilable"})
        }
        if(getproducts.isDeleted==false){
            return res.status(200).send({status:true,msg:"product is already deleted"})
        }
        return res.status(400).send({status:false,msg:"got data",data:getproducts})

        
    } catch (error) {
        return res.status(500).send({status:false,msg:error.message})
        
    }
}

//-----------------------------------------------4th api-------------------------------------


const updatedProductById=async function(req,res){
    try {
          let data=req.body
          let files=req.files
        const productId = req.params.productId
        
        const checkProductId = await productModel.findOne({ _id: productId, isDeleted: false })
     if (!checkProductId) {
            return res.status(404).send({ status: false, msg: 'please provide valid product id ' })
        }
 const { title,description,price,currencyId,currencyFormat,availableSizes,style,installments}=data

        const emptyobj = {}
        
        if (!validator.isValid(title)) {
            return res.status(400).send({status:false,msg:"title is required"})
        }
        if(title){
        const dubTitle=await productModel.findOne({title:title})
        if(dubTitle){
            return res.status(400).send({status:false,msg:"title already exist"})
        }
        emptyobj.title=title
    }
      
       if(description){
           if(!validator.isValid(description)){
               return res.status(400).send({status:false,msg:"required descriptio"})

           }
           emptyobj.description=description
       }
        if(price){
        if (!validator.isValid(price)) {
            
            return res.status(400).send({status:false,msg:"price is required"})
        }
        emptyobj.price=price
    }
          if(currencyId){
        if (!validator.isValid(currencyId)) {
            return res.status(400).send({status:false,msg:"currencyId is required"})
        }
        emptyobj.currencyId=currencyId
    }
        
       if(currencyFormat){
        if (!validator.isValid(currencyFormat)) {
            return res.status(400).send({status:false,msg:"currencyformat is requird"})
        }

    }
       if(style){
        if (!validator.isValid(style)) {
            return res.status(400).send({status:false,msg:"style is required"})
        }
        emptyobj.style=style

    }
        if (availableSizes) {

            if (availableSizes.length === 0) {
                return res.status(400).send({ status: false, msg: 'please provide the product size' })
            }
          
            emptyobj.availableSizes =availableSizes
        }
        if (validator.isValid(installments)) {
            emptyobj.installments = installments
        }
        
        if (validator.isValid(files)) {
            productImage = await aws.uploadFile(files[0]);
            emptyobj.productImage = productImage

        }

        const product = await productModel.findOneAndUpdate({ _id: productId },emptyobj, { new: true })

        return res.status(200).send({ status: true, message: ' updated Successfully', data: product });

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }

}
//-----------------------------------------5th api--------------------------------------

const deleteproductById = async function (req, res) {
    try {
        let productId = req.params.productId
        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, msg: "need valid productid" })
        }
        const productwithId = await productModel.findById({ _id: productId })
        if (!productwithId) {
            return res.status(404).send({ status: false, msg: "not able to found" })
        }
        if (productwithId.isDeleted == true) {
            return res.status(400).send({ status: false, msg: "product already deleted" })
        }

        const productdelete = await productModel.findByIdAndUpdate({ _id: productId }, { $set: { isDeleted: true, deletedAt: new Date() } }, { new: true })
        return res.status(400).send({ status: true, msg: "deleted sucessfully", data: productdelete })

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })

    }

}










module.exports = {
    createProduct,
    gettingProduct,
    getproductsById,
    updatedProductById,
    deleteproductById
    

}