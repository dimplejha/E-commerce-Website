const validator = require('../middleware/validator')
const aws = require('../middleware/aws')
const productModel = require('../model/productModel')


//creating product by validating all details.
const productCreation = async function(req, res) {
    try {
        let files = req.files;
        let requestBody = req.body;
        

        //-----------------------validating empty req body.
        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "Please provide valid request body" })
        }

        //-----------------------extract params for request body.
        let {
            title,
            description,
            price,
            currencyId,
            currencyFormat,
            isFreeShipping,
            style,
            availableSizes,
            installments
        } = requestBody

        //-----------------------validation for the params starts.----------------------
        if (!validator.isValid(title)) {
            return res.status(400).send({ status: false, message: "Title is required" })
        }

        //------------------------uploading product image to AWS.------------------------
        if (files) {
            if (validator.isValidRequestBody(files)) {
                if (!(files && files.length > 0)) {
                    return res.status(400).send({ status: false, message: "Please provide product image" })
                }
                
            }
        }

        let productImage = await aws.uploadFile(files[0]);

        //-----------------------object destructuring for response body.------------------------
        const newProductData = {
            title,
            description,
            price,
            currencyId,
            currencyFormat: currencyFormat,
            isFreeShipping,
            style,
            availableSizes,
            installments,
            productImage: productImage
        }
        const saveProductDetails = await productModel.create(newProductData)
        return res.status(201).send({ status: true, message: "Product added successfully.", data: saveProductDetails })

    } catch (err) {
        return res.status(500).send({
            status: false,
            message: "Error is : " + err
        })
    }
}









module.exports = {
    productCreation,
    
}