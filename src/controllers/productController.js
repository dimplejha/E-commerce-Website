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
        if (!validator.isValidPrice(price)) {
            return res.status(400).send({ status: false, message: "Enter valid price" })
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

// let getProductsByfilter = async function (req, res) {
//     try {
//         const QueryParam = req.query
//         const { size, name, priceGreaterThan, priceLesserThan, priceSort } = QueryParam

//         if (!validator.isValidRequestBody(QueryParam)) {
//             const productsNotDeleted = await productModel.find({ isDeleted: false }).sort({ title: 1 })
//             return res.status(200).send({ status: true, data: productsNotDeleted })
//         }

//         const filter = { isDeleted: false }

//         if (size) {
//             for (let i = 0; i < size.length; i++) {
//                 if (["S", "XS", "M", "X", "L", "XXL", "XL"].includes(size[i])) {
//                     filter['availableSizes'] = size
//                 }
//             }
//         }
//         let productName = []
//         if (name != null) {
//             const productTitle = await productModel.find({ isDeleted: false }).select({ title: 1, _id: 0 })
//             for (let i = 0; i < productTitle.length; i++) {
//                 var checkTitle = productTitle[i].title

//                 let includeChar = checkTitle.includes(name)
//                 if (includeChar)
//                     productName.push(checkTitle)

//                 filter['title'] = productName
//             }
//         }

//         if (priceGreaterThan) {
//             if(!validator.isValidNumber(priceGreaterThan)){
//                 return res.status(400).send({status:false,message:"PriceGreaterThan must be a number "})
//             }
//             filter['price'] = { $gt: priceGreaterThan }
//         }

//         if (priceLesserThan) {
//             if(!validator.isValidNumber(priceLesserThan)){
//                 return res.status(400).send({status:false,message:"PriceLesserThan must be a number "})
//             }
//             filter['price'] = { $lt: priceLesserThan }
//         }
//         if (priceGreaterThan && priceLesserThan) {
            
//             filter['price'] = { $gt: priceGreaterThan, $lt: priceLesserThan }
//         }

//         if (priceSort) {
//             if (priceSort != 1 || priceSort != -1) {
//                 return res.status(400).send({ status: false, message: "You can sort price by using 1 and -1" })
//             }
//         }

//         const productsData = await productModel.find(filter).sort({ price: priceSort })

//         if (productsData.length == 0) {
//             return res.status(400).send({ status: false, message: "No product Exist" })
//         }
//         return res.status(200).send({ status: true, message: 'product list', data: productsData })

//     }
//     catch (error) {
//         return res.status(500).send({ status: false, message: error.message })
//     }
// }


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


const updatedProductById = async function (req, res) {
    try {
        let data = req.body
        let files = req.files
        const productId = req.params.productId

        const checkProductId = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!checkProductId) {
            return res.status(404).send({ status: false, msg: 'please provide valid product id ' })
        }
        const { title, description, price, currencyId, currencyFormat, availableSizes, style, installments } = data

        const emptyobj = {}

        if (!validator.isValid(title)) {
            return res.status(400).send({ status: false, msg: "title is required" })
        }
        if (title) {
            const dubTitle = await productModel.findOne({ title: title })
            if (dubTitle) {
                return res.status(400).send({ status: false, msg: "title already exist" })
            }
            emptyobj.title = title
        }

        if (description) {
            if (!validator.isValid(description)) {
                return res.status(400).send({ status: false, msg: "required description" })

            }
            emptyobj.description = description
        }
        if (price) {
            if (!validator.isValid(price)) {

                return res.status(400).send({ status: false, msg: "price is required" })
            }
            emptyobj.price = price
        }
        if (currencyId) {
            if (!validator.isValid(currencyId)) {
                return res.status(400).send({ status: false, msg: "currencyId is required" })
            }
            emptyobj.currencyId = currencyId
        }

        if (currencyFormat) {
            if (!validator.isValid(currencyFormat)) {
                return res.status(400).send({ status: false, msg: "currencyformat is requird" })
            }

        }
        if (style) {
            if (!validator.isValid(style)) {
                return res.status(400).send({ status: false, msg: "style is required" })
            }
            emptyobj.style = style

        }
        if (availableSizes) {

            if (availableSizes.length === 0) {
                return res.status(400).send({ status: false, msg: 'please provide the product size' })
            }

            emptyobj.availableSizes = availableSizes
        }
        if (validator.isValid(installments)) {
            emptyobj.installments = installments
        }

        if (validator.isValid(files)) {
            productImage = await aws.uploadFile(files[0]);
            emptyobj.productImage = productImage

        }

        const product = await productModel.findOneAndUpdate({ _id: productId }, emptyobj, { new: true })

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
    updatedProductById,
    deleteproductById


}