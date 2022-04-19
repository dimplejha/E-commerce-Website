const validator = require('../middleware/validator')
const productModel = require('../model/productModel')
const userModel = require('../model/userModel')
const cartModel = require('../model/cartModel')




//-----------------------------------------------------------1st api---------------------------------------------------------

const createCart = async function (req, res) {
  try {
    const user_id = req.params.userId;
    const idFromToken = req.userId

    //-------------validation start------------------
    if (!validator.isValid(user_id)) {
      return res.status(400).send({ status: false, message: "Enter the userId" });
    }
    
    if (!validator.isValidObjectId(user_id)) {
      return res.status(400).send({ status: false, message: "Enter a valid userId in params" });
    }

    //---finding userId(params)in DB
    const user = await userModel.findOne({ _id: user_id });
    if (!user) {
      return res.status(404).send({ status: false, message: "User not found" });
    }

    //---------authorisation---------
    if (user_id != idFromToken) {
      return res.status(401).send({ status: false, message: "User not authorized" })
    }

    const requestBody = req.body;

    if (!validator.isValidRequestBody(requestBody)) {
      return res.status(400).send({ status: false, message: "Enter cart details" });
    }

    const { userId, items } = requestBody;
    //console.log(items.productId)


    // if (req.userId !== userId) {
    //   return res.status(400).send({ status: false, msg: "userId in params  and req.body are not same" })
    // }


    //--------validating items in req.body------------
    if (!validator.isValid(items[0].productId)) {
      return res.status(400).send({ status: false, message: "enter the productId" });
    }

    if (!validator.isValidObjectId(items[0].productId)) {
      return res.status(400).send({ status: false, message: "enter a valid productId" });
    }

    if (!validator.isValid(items[0].quantity) && items[0].quantity < 1) {
      return res.status(400).send({ status: false, message: "enter a qunatity more than 1 " });
    }
    //-----------------------------------validation ends---------------------------------------

    const product = await productModel.findOne({ _id: items[0].productId });

    if (!product) {
      return res.status(404).send({ status: false, message: "product not found" });
    }

    const cartAlreadyPresent = await cartModel.findOne({ userId: user_id });
    

    let totalItems =items.length;
    let totalPrice = product.price * totalItems;

    if (cartAlreadyPresent) {

      //totalItems +=totalItems;
      
      totalPrice += cartAlreadyPresent.totalPrice;

      let itemsArr = cartAlreadyPresent.items
      for (i in itemsArr) {
        if (itemsArr[i].productId.toString() === items[0].productId) {
          itemsArr[i].quantity += items[0].quantity

          let updatedCart = { items: itemsArr, totalPrice: totalPrice, totalItems: itemsArr.length }

          let responseData = await cartModel.findOneAndUpdate({ userId: userId }, updatedCart, { new: true })

          return res.status(200).send({ status: true, message: `Product added successfully`, data: responseData })
        }
      }
      itemsArr.push({ productId: items[0].productId, quantity: items[0].quantity }) 

      let updatedCart = { items: itemsArr, totalPrice: totalPrice, totalItems: itemsArr.length }
      let responseData = await cartModel.findOneAndUpdate({ userId: userId }, updatedCart, { new: true })

      return res.status(200).send({ status: true, message: `Product added successfully`, data: responseData })
    }

    newCart = {
      userId,
      items,
      totalPrice,
      totalItems,
    };

    newCart = await cartModel.create(newCart);

    return res.status(201).send({ status: "SUCCESS", message: "cart created successfully", data: newCart });
  }
  catch (error) {
    return res.status(500).send({ status: false, message: error.message })
  }
}


//---------------------------------------------------------------2nd api----------------------------------------------------------------




//Updates a cart by either decrementing the quantity of a product by 1 or deleting a product from the cart.
// - Get cart id in request body.
// - Get productId in request body.
// - Get key 'removeProduct' in request body. 
// - Make sure that cart exist.
// - Key 'removeProduct' denotes whether a product is to be removed({removeProduct: 0}) or its quantity has to be decremented by 1({removeProduct: 1}).
// - Make sure the userId in params and in JWT token match.
// - Make sure the user exist
// - Get product(s) details in response body.
// - Check if the productId exists and is not deleted before updating the cart.







const updatedCart = async function (req, res) {
  try {
    let userId = req.params.userId
    const idFromToken = req.userId
    if (!validator.isValidObjectId(userId)) {
      return res.status(400).send({ status: false, msg: "userId is not a valid objectId" })
    }

    //-----authorization--------------
    if (userId!= idFromToken) {
      return res.status(401).send({ status: false, message: "User not authorized" })
    }

    let data = req.body
    const { cartId, productId, removeProduct } = data

    if (!validator.isValidRequestBody(data)) {
      return res.status(400).send({ status: false, msg: "Enter value to be updating.." })
    }
    if (!validator.isValid(cartId)) {
      return res.status(400).send({ status: false, msg: "cartId is required" })
    }
    if (!validator.isValidObjectId(cartId)) {
      return res.status(400).send({ status: false, msg: "cartId is not a valid objectId" })
    }
    if (!validator.isValid(productId)) {
      return res.status(400).send({ status: false, msg: "productId is required" })
    }
    if (!validator.isValidObjectId(productId)) {
      return res.status(400).send({ status: false, msg: "productId is not a valid objectId" })
    }
    if (!(removeProduct == 0 || removeProduct == 1)) {
      return res.status(400).send({ status: false, msg: "removeProduct value should be either 0 or 1" })
    }

    const userDetails = await userModel.findOne({ _id: userId })
    if (!userDetails) {
      return res.status(404).send({ status: false, msg: "user not exist with this userId" })
    }
    const productDetails = await productModel.findOne({ _id: productId, isDeleted: false })
    if (!productDetails) {
      return res.status(404).send({ status: false, msg: "product not exist or deleted" })
    }
    const cartDetails = await cartModel.findOne({ _id: cartId })
    if (!cartDetails) {
      return res.status(400).send({ status: false, msg: "cart is not added for this cardId, create cart first" })
    }

    if (removeProduct == 1) {
      for (let i = 0; i < cartDetails.items.length; i++) {
        if (cartDetails.items[i].productId == productId) {
          let newPrice = cartDetails.totalPrice - productDetails.price
          if (cartDetails.items[i].quantity > 1) {
            cartDetails.items[i].quantity -= 1
            let updateCartDetails = await cartModel.findOneAndUpdate({ _id: cartId }, { items: cartDetails.items, totalPrice: newPrice }, { new: true })
            return res.status(200).send({ status: true, msg: "cart updated successfully", data: updateCartDetails })
          }
          else {
            totalItem = cartDetails.totalItems - 1
            cartDetails.items.splice(i, 1)

            let updatedDetails = await cartModel.findOneAndUpdate({ _id: cartId }, { items: cartDetails.items, totalPrice: newPrice, totalItems: totalItem }, { new: true })
            return res.status(200).send({ status: true, msg: "cart removed successfully", data: updatedDetails })
          }
        }
      }
    }

    if (removeProduct == 0) {
      for (let i = 0; i < cartDetails.items.length; i++) {
        if (cartDetails.items[i].productId == productId) {
          let newPrice = cartDetails.totalPrice - (productDetails.price * cartDetails.items[i].quantity)
          let totalItem = cartDetails.totalItems - 1
          cartDetails.items.splice(i, 1)
          let updatedCartDetails = await cartModel.findOneAndUpdate({ _id: cartId }, { items: cartDetails.items, totalItems: totalItem, totalPrice: newPrice }, { new: true })
          return res.status(200).send({ status: true, msg: "item removed successfully", data: updatedCartDetails })
        }
      }
    }

  }
  catch (error) {
    return res.status(500).send({ status: false, message: error.message })
  }
}

//------------------------------------------------------------------3rd api--------------------------------------------------------------------------------



const getcartById = async function (req, res) {
  try {
    const userId = req.params.userId
    let idFromToken = req.userId


    // if (req.userId !== userId) {
    //   return res.status(401).send({ status: false, msg: "you are not authorized" })
    // }
    if (!validator.isValidObjectId(userId)) {
      return res.status(400).send({ status: false, msg: "invalid userid" })
    }

    const userexist = await userModel.findById({ _id: userId })
    if (!userexist) {
      return res.status(404).send({ status: false, msg: "user doesnot exist" })
    }

    //---------------authorisation--------------
    if (userId!= idFromToken) {
      return res.status(401).send({ status: false, message: "User not authorized" })
    }
    

    const cart = await cartModel.findOne({ userId: userId })
    if (!userexist) {
      return res.status(400).send({ status: false, msg: "no cart exist" })
    }
    return res.status(200).send({ status: true, msg: "successfully found", data: cart })


  } catch (error) {
    return res.status(400).send({ status: false, msg: error.message })

  }
}




//-------------------------------------------------------------------4th api------------------------------------------------------------------

const emptyCart = async function (req, res) {
  try {
    const userId = req.params.userId
    let idFromToken = req.userId

    //---------------------validating userId---------------
    if (!validator.isValidObjectId(userId)) {
      return res.status(400).send({ status: false, message: "Invalid userId in params." })
  }
  const findUser = await userModel.findOne({ _id: userId })
  if (!findUser) {
      return res.status(400).send({
          status: false,
          message: `User doesn't exists by ${userId} `
      })
  }


  //--------------authorisating--------
  if (userId!= idFromToken) {
    return res.status(401).send({ status: false, message: "User not authorized" })
  }

  //----------validatig cartId--------------
    const cartByUserId = await cartModel.findOne({ userId: userId });

    if (!cartByUserId) {
      return res.status(404).send({
        status: false,
        message: `no cart found by ${userId}`,
      });
    }

    const makeCartEmpty = await cartModel.findOneAndUpdate(
      { userId: userId },
      { $set: { items: [], totalPrice: 0, totalItems: 0 } },
      { new: true }
    )
    return res.status(200).send({ status: true, message: "cart made empty successfully", data: makeCartEmpty })

  } catch (error) {
    res.status(500).send({ error: error.message })
  }
}



module.exports = {
  createCart,
  updatedCart,
  emptyCart,
  getcartById
}