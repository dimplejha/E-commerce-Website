const validator = require('../middleware/validator')
const aws = require('../middleware/aws')
const productModel = require('../model/productModel')
//const ObjectId = require('mongoose').Types.ObjectId;




//--------------------------------------------1st api---------------------------------------------------------------------



const createProduct = async (req, res) => {
    try {

        //Checking if no data is present in our request body
        let data = req.body
        if (!validator.isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Please enter details of product" })
        }

        //Checking if user has entered these mandatory fields or not
        const { title, description, price, currencyId, currencyFormat, productImage, availableSizes, style, installments,isFreeShipping } = data

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
        if (!validator.isValidPrice(price)) {
            return res.status(400).send({ status: false, message: "Enter valid price" })
        }
        if (price <= 0) {
            return res.status(400).send({ status: false, message: "price greater than 0" })
        }

        if (!validator.isValid(currencyId)) {
            return res.status(400).send({ status: false, message: "currencyId is required" })
        }

        if (!validator.isValid(currencyFormat)) {
            return res.status(400).send({ status: false, message: "currencyFormat is required" })
        }
        if (!validator.isValidCurrencyFormat(currencyFormat)) {
            return res.status(400).send({ status: false, message: "currencyFormat is not valid" })
        }
        if (!((isFreeShipping == 'true') || (isFreeShipping == 'false'))) {
            return res.status(400).send({ status: false, message: "isFreeShipping is boolean value" })
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
        //data.availableSizes=JSON.parse(data.availableSizes)

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




const getProductsByfilter = async function (req, res) {

    try {

        const requestQuery = req.query

        const { size, name, priceGreaterThan, priceLessThan, priceSort } = requestQuery

        const finalFilter = [{ isDeleted: false }]

        if (validator.isValid(name)) {
            finalFilter.push({ title: { $regex: name, $options: "$i" } })
        }
        if (validator.isValid(size)) {
            if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(size))) {
                return res.status(400).send({ status: false, message: "please enter valid size  " })
            }
            finalFilter.push({ availableSizes: size })
        }

        if (validator.isValidNumber(priceGreaterThan)) {

            finalFilter.push({ price: { $gt: priceGreaterThan } })
        }
        if (validator.isValidNumber(priceLessThan)) {

            finalFilter.push({ price: { $lt: priceLessThan } })
        }

     
        if (validator.isValidNumber(priceSort)) {

            if (priceSort != 1 && priceSort != -1) {
                return res.status(400).send({ status: false, message: "pricesort must to 1 or -1" })
            }
            const productpricessort = await productModel.find({ $and: finalFilter }).sort({ price: priceSort })

            if (Array.isArray(productpricessort) && productpricessort.length === 0) {
                return res.status(404).send({ status: false, message: "data not found" })
            }

            return res.status(200).send({ status: true, message: "products with sorted price", data:productpricessort })
        }

          
        const fillteredProducts = await productModel.find({ $and: finalFilter })
         //for checking array
        if (Array.isArray(fillteredProducts) && fillteredProducts.length === 0) {
            return res.status(404).send({ status: false, message: "data not found" })
        }

        return res.status(200).send({ status: true, message: "products without sorted", data: fillteredProducts })


    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}







//-------------------------------3rd api ---------------------------------------------------

const getproductsById = async function (req, res) {

    try {
        let productId = req.params.productId
        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, msg: "product id is not valid" })
        }
        const getproducts = await productModel.findById({ _id: productId })
        if (!getproducts) {
            return res.status(404).send({ status: false, msg: "this product are not avilable" })
        }
        if (getproducts.isDeleted == false) {
            return res.status(200).send({ status: true,msg: "got data", data: getproducts })
        }
        return res.status(400).send({ status: false, msg: "productId already deleted"})


    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })

    }
}

//-----------------------------------------------4th api-------------------------------------


const updatedProducts = async function (req, res) {
    try {
        let productId = req.params.productId

        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "UserId not a valid ObjectId" })
        }

        let productData = await productModel.findOne({ _id: productId })
        if (!productData) {
            return res.status(404).send({ status: false, message: "product not present in the collection" })
        }

        if (productData.isDeleted == true) {
            return res.status(400).send({ status: false, message: "product already Deleted" })
        }
        let data = req.body
        const { title, description, price, currencyId, availableSizes, style, installments } = data

        let updatedData = {}

        if (validator.isValid(title)) {
            let uniqueTitle = await productModel.findOne({ title: title })
            if (uniqueTitle) {
                return res.status(400).send({ status: false, message: "Title already exists" })
            }
            if (!Object.prototype.hasOwnProperty.call(updatedData, '$set')) updatedData['$set'] = {}
            updatedData['$set']['title'] = title
        }

        if (validator.isValid(description)) {
            if (!Object.prototype.hasOwnProperty.call(updatedData, '$set')) updatedData['$set'] = {}
            updatedData['$set']['description'] = description
        }

        if (validator.isValid(price)) {
            if (!validator.isValidNumber(price)) {
                return res.status(400).send({ status: false, message: "price is should be a number" })
            }
            if (price <= 0) {
                return res.status(400).send({ status: false, message: "price greater than 0" })
            }
            if (!Object.prototype.hasOwnProperty.call(updatedData, '$set')) updatedData['$set'] = {}
            updatedData['$set']['price'] = price
        }


        let files = req.files
        if (files && files.length > 0) {
            let uploadedFileURL = await s3.uploadFile(files[0])
            data['productImage'] = uploadedFileURL

            if (!Object.prototype.hasOwnProperty.call(updatedData, '$set')) updatedData['$set'] = {}
            updatedData['$set']['productImage'] = data.productImage
        } else {

            if (!Object.prototype.hasOwnProperty.call(updatedData, '$set')) updatedData['$set'] = {}
            updatedData['$set']['productImage'] = productData.productImage
        }

        if (validator.isValid(currencyId)) {
            if (!(currencyId == 'INR')) {
                return res.status(400).send({ status: false, message: "currencyId should be INR" })
            }
            if (!Object.prototype.hasOwnProperty.call(updatedData, '$set')) updatedData['$set'] = {}
            updatedData['$set']['currencyId'] = currencyId
        }

        if (validator.isValid(availableSizes)) {
            let sizeArray = availableSizes.split(",").map(x => x.trim())
            for (let i = 0; i < sizeArray.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(sizeArray[i]))) {
                    return res.status(400).send({ status: false, message: `Available Sizes must be among ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
                }
            }
            if (!Object.prototype.hasOwnProperty.call(updatedData, '$addToSet')) updatedData['$addToSet'] = {}

            if (Array.isArray(sizeArray)) {
                updatedData['$addToSet']['availableSizes'] = { $each: sizeArray }
            }
        }

        if (validator.isValid(style)) {
            if (!Object.prototype.hasOwnProperty.call(updatedData, '$set')) updatedData['$set'] = {}
            updatedData['$set']['style'] = style
        }

        if (validator.isValid(installments)) {
            if (!isValidNumber(installments)) {
                return res.status(400).send({ status: false, message: "Installment should be a number" })
            }
            if (!Object.prototype.hasOwnProperty.call(updatedData, '$set')) updatedData['$set'] = {}
            updatedData['$set']['installments'] = installments
        }

        if (!validator.isValidRequestBody(data) && !files) {
            return res.status(400).send({ status: true, message: "No data passed to modify" })
        }

        let updatedDetails = await productModel.findByIdAndUpdate(productId, updatedData, { new: true })
        return res.status(200).send({ status: true, message: "product updated", data: updatedDetails })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}
//-----------------------------------------5th api--------------------------------------

const deleteproductById = async function (req, res) {
    try {
        let productId = req.params.productId
        if (!productId) { return res.status(400).send({ status: false, message: "productId required" }) }

        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, msg: "need valid productid in the params" })
        }
        const productwithId = await productModel.findById({ _id: productId })
        if (!productwithId) {
            return res.status(404).send({ status: false, msg: "not able to found" })
        }
        if (productwithId.isDeleted == true) {
            return res.status(400).send({ status: false, msg: "product already deleted" })
        }
        

        const productdelete = await productModel.findByIdAndUpdate({ _id: productId }, { $set: { isDeleted: true, deletedAt: new Date() } }, { new: true })
        return res.status(200).send({ status: true, msg: "deleted sucessfully", data: productdelete })

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })

    }

}





module.exports = {
    createProduct,
    getProductsByfilter,
    getproductsById,
    updatedProducts,
    deleteproductById


}