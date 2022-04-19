const validator = require("../middleware/validator");
const userModel = require("../model/userModel");
const cartModel = require("../model/cartModel");
const orderModel = require("../model/orderModel");





//---------------------------------1st--------------------------------------------------------------------------------------------------------------------
const createOrder = async function (req, res) {
    try {
        const userId = req.params.userId;
        const idFromToken = req.userId

        //-----------------validation starts----------------
        if (!validator.isValid(userId)) {
            return res.status(400).send({ status: false, message: "Enter the userId" });
        }
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Enter a valid userId" });
        }

        const user = await userModel.findOne({ _id: userId });
        if (!user) {
            return res.status(404).send({ status: false, message: "User not found" });
        }

        //-----------authorisation------------

        if (userId != idFromToken) {
            return res.status(403).send({ status: false, message: "User not authorized" })
        }

        const requestBody = req.body;

        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "Enter cart details" });
        }

        const { cartId } = requestBody;
        if (!validator.isValid(cartId)) {
            return res.status(400).send({ status: false, message: "Enter the cartId" });
        }

        if (!validator.isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: "Enter a valid cartId" });
        }
        const cartAlreadyPresent = await cartModel.findOne({ _id: cartId });
        if (!cartAlreadyPresent) {
            return res.status(404).send({ status: false, message: "cart not found" });
        }

        if (cartAlreadyPresent.userId != userId) {
            return res.status(400).send({ status: false, message: "With this user cart is not created" });
        }

        if (cartAlreadyPresent.totalItems == 0) {
            return res.status(400).send({ status: "SUCCESS", message: "There is no product to order ,First add product" })
        }

        let totalPrice = cartAlreadyPresent.totalPrice;
        let totalItems = cartAlreadyPresent.items.length
        let totalQuantity = 0

        let itemsArr = cartAlreadyPresent.items
        for (i in itemsArr) {
            totalQuantity += itemsArr[i].quantity

        }

        let newOrder = {
            userId: userId,
            items: cartAlreadyPresent.items,
            totalPrice: totalPrice,
            totalItems: totalItems,
            totalQuantity: totalQuantity
        };

        orderData = await orderModel.create(newOrder);
        return res.status(200).send({ status: "SUCCESS", message: "Order placed successfully", data: orderData });

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

//----------------------------------------------------------2api --------------------------------------------------------------------




const updateOrder = async function (req, res) {
    try {
        let requestBody = req.body;
        const userId = req.params.userId
       
        const { orderId,status } = requestBody

        //-----------------validation starts-------------
       if(Object.keys(requestBody).length==0){
           return res.status(400).send({status:false,msg:"bad req"})
       }
       if (!validator.isValidObjectId(userId)) {
        return res.status(400).send({ status: false, message:"userId is not valid" })
    }
       
        if (req.userId!==userId) {
            return res.status(400).send({ status: false, msg: "you are not authorized" })
        }

      
        if (!validator.isValid(orderId)) {
            return res.status(400).send({ status:false, message: 'orderId is required' })
        }
        if (!validator.isValidObjectId(orderId)) {
            return res.status(400).send({ status: false, message: "orderId is not valid" })
        }
        const Order = await orderModel.findOne({ _id: orderId, isDeleted: false })
        if (!Order) {
            return res.status(400).send({ status:false, message: 'order id not correct ' })
        } 
     
        if(validator.isValid(status)){
                        if(!(["pending", "completed", "cancelled"].includes(status))){
                            return res.status(400).send({status:false,message:"status is invalid"})
                        }
                    }
       
        let updateOrder = await orderModel.findOneAndUpdate({ _id: orderId }, { status:status }, { new: true }).select({isDeleted:0,deletedAt:0})
        res.status(200).send({ status: true, msg: 'sucesfully updated', data: updateOrder })

    } catch (error) {
        res.status(500).send({ status: false, Message: error.message })
    }
}














module.exports={
    createOrder,
    updateOrder
}

