const validator = require("../middleware/validator");
const userModel = require("../model/userModel");
const cartModel = require("../model/cartModel");
const orderModel = require("../model/orderModel");





//---------------------------------1st--------------------------------------------------------------------------------------------------------------------
// const createOrder = async function (req, res) {
//     try {
//         const userId = req.params.userId;
//         const idFromToken = req.userId

//         //-----------------validation starts----------------
//         if (!validator.isValid(userId)) {
//             return res.status(400).send({ status: false, message: "Enter the userId" });
//         }
//         if (!validator.isValidObjectId(userId)) {
//             return res.status(400).send({ status: false, message: "Enter a valid userId" });
//         }

//         const user = await userModel.findOne({ _id: userId });
//         if (!user) {
//             return res.status(404).send({ status: false, message: "User not found" });
//         }

//         //-----------authorisation------------

//         if (userId != idFromToken) {
//             return res.status(401).send({ status: false, message: "User not authorized" })
//         }

//         const requestBody = req.body;

//         if (!validator.isValidRequestBody(requestBody)) {
//             return res.status(400).send({ status: false, message: "Enter cart details" });
//         }

//         const { cartId } = requestBody;
//         if (!validator.isValid(cartId)) {
//             return res.status(400).send({ status: false, message: "Enter the cartId" });
//         }

//         if (!validator.isValidObjectId(cartId)) {
//             return res.status(400).send({ status: false, message: "Enter a valid cartId" });
//         }
//         const cartAlreadyPresent = await cartModel.findOne({ _id: cartId });
//         if (!cartAlreadyPresent) {
//             return res.status(404).send({ status: false, message: "cart not found" });
//         }

//         if (cartAlreadyPresent.userId != userId) {
//             return res.status(400).send({ status: false, message: "With this user cart is not created" });
//         }

//         if (cartAlreadyPresent.totalItems == 0) {
//             return res.status(400).send({ status: "SUCCESS", message: "There is no product to order ,First add product" })
//         }

//         let totalPrice = cartAlreadyPresent.totalPrice;
//         let totalItems = cartAlreadyPresent.items.length
//         let totalQuantity = 0

//         let itemsArr = cartAlreadyPresent.items
//         for (i in itemsArr) {
//             totalQuantity += itemsArr[i].quantity

//         }

//         let newOrder = {
//             userId: userId,
//             items: cartAlreadyPresent.items,
//             totalPrice: totalPrice,
//             totalItems: totalItems,
//             totalQuantity: totalQuantity
//         };

//         orderData = await orderModel.create(newOrder);
//         return res.status(200).send({ status: "SUCCESS", message: "Order placed successfully", data: orderData });

//     }
//     catch (error) {
//         return res.status(500).send({ status: false, message: error.message })
//     }
// }

const createOrder = async function (req, res) {
    try {
        let requestBody = req.body;
        const userId = req.params.userId

        let { items,totalItems, totalPrice,totalQuantity} = requestBody
       
        if(Object.keys(requestBody).length==0){
            return res.status(400).send({status:false,msg:"bad req"})
        }
    
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message:"userid is not valid" })
        }
        requestBody.userId=userId
           
        if (req.userId!==userId) {
            return res.status(401).send({ status: false, msg: "you are not authorized" })
        }

        if (items.length ==0) {
            return res.status(400).send({ status: false, msg: "empty items" })
        }
        if (!validator.isValid(items)) {
            return res.status(400).send({ status: false, message: "items is required" })
        }
        if (!validator.isValid(totalPrice)) {
            return res.status(400).send({ status: false, message: "totalPrice is required"})
        }
        if (!validator.isValid(totalItems)) {
            return res.status(400).send({ status: false, message: "totalItems is required"})
        }
        if(!validator.isValid(totalQuantity)){
            return res.status(400).send({status:false,msg:"totalQunatity is required"})
        }
         
        const createProduct = await orderModel.create(requestBody);
        res.status(201).send({ status: true, msg: 'sucesfully created order', data: createProduct })

    } catch (error) {
        res.status(500).send({ status: false, Message: error.message })
    }
}

//----------------------------------------------------------2api --------------------------------------------------------------------




const updateOrder = async function (req, res) {
    try {
        let userId = req.params.userId
        let { orderId , status} = req.body

        // if (!validator.isValidobjectId(userId)) {
        //     return res.status(400).send({ status: false, msg: "invalid userId" })
        // }
        // const userExist = await userModel.findById({ _id: userId })
        // if (!userExist) {
        //     return res.status(404).send({ status: false, msg: "user not found" })
        // }

        if(!validator.isValidRequestBody(req.body)){
            return res.status(400).send({status:false, message:"Bad Request request body is empty"})
        }


        if (!validator.isValidObjectId(orderId)) {
            return res.status(400).send({ status: false, msg: "invalid orderId" })
        }

        const orderExist = await orderModel.findOne({ _id: orderId, userId:userId, isDeleted: false })
        if (!orderExist) {
            return res.status(404).send({ status: false, msg: "order does not exist" })
        }

      
        console.log(orderExist, orderExist.status)

        if(orderExist.status == "completed"){
            return res.status(400).send({status:false, message:"this order is already completed you can not change the status"})
        }
        if(orderExist.status == "cancled"){
            return res.status(400).send({status:false, message:"this order is already cancled you can not change the status"})
        }
        
        if(!["pending", "completed", "cancled"].includes(status)){
            return res.status(400).send({status:"false", message:"status is invalid you can only completed or cancle order"})
        }
        if (orderExist.cancellable != true && status == "cancled") {
            return res.status(400).send({ status: false, msg: "order can not be cancel" })
        }
        // if (userId != orderExist.userId) {
        //     return res.status(400).send({ status: false, msg: "credentials are not matching" })
        // }
        const updatedOrder = await orderModel.findOneAndUpdate({ _id: orderId, isDeleted: false },
             { status: status }, { new: true })
       
            return res.status(200).send({ status: false, msg: "order updated successfully", data: updatedOrder })
        
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}














module.exports={
    createOrder,
    updateOrder
}

