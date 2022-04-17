const validator = require('../middleware/validator')
const productModel = require('../model/productModel')
const userModel = require('../model/userModel')
const cartModel = require('../model/cartModel')




//-----------------------------------------------------------1st api---------------------------------------------------------
const addToCart = async (req, res) => {
  try {
    const userIdFromParams = req.params.userId;

    if (!validator.isValid(userIdFromParams)) {
      return res
        .status(400)
        .send({ status: "false", msg: "enter the userId" });
    }
    if (!validator.isValidObjectId(userIdFromParams)) {
      return res
        .status(400)
        .send({ status: "false", msg: "enter a valid userId" });
    }

    const user = await userModel.findOne({ _id: userIdFromParams });

    if (!user) {
      return res.status(404).send({ status: "false", msg: "user not found" });
    }

    const cartAlreadyPresent = await cartModel.findOne({
      userId: userIdFromParams,
    });

    const requestBody = req.body;

    if (!validator.isValidRequestBody(requestBody)) {
      return res.status(400).send({ status: "false", msg: "enter a body" });
    }

    const { userId, items } = requestBody;
    console.log(items.productId)

    if (!validator.isValid(userId)) {
      return res
        .status(400)
        .send({ status: "false", msg: "enter the userId" });
    }

    if (!validator.isValidObjectId(userId)) {
      return res
        .status(400)
        .send({ status: "false", msg: "enter a valid userId" });
    }
    //----------authorisation--------------
    if (userIdFromParams !== userId) {
      return res.status(400).send({
        status: "false",
        msg: "user in params doesn't match with user in body",
      });
    }

    if (!validator.isValid(items[0].productId)) {
      return res
        .status(400)
        .send({ status: "false", msg: "enter the productId" });
    }

    if (!validator.isValidObjectId(items[0].productId)) {
      return res
        .status(400)
        .send({ status: "false", msg: "enter a valid productId" });
    }

    if (!validator.isValid(items[0].quantity) && items[0].quantity < 1) {
      return res
        .status(400)
        .send({ status: "false", msg: "enter a qunatity more than 1 " });
    }

    const product = await productModel.findOne({ _id: items[0].productId });

    if (!product) {
      return res
        .status(404)
        .send({ status: "false", msg: "product not found" });
    }

    let totalItems = items.length;
    let totalPrice = product.price * totalItems;

    if (cartAlreadyPresent) {

      totalItems += 1;
      totalPrice += cartAlreadyPresent.totalPrice;

      const cart = await cartModel.findOneAndUpdate(
        { userId: userIdFromParams },
        {
          $push: { items: items },
          $set: { totalPrice: totalPrice, totalItems: totalItems },
        },
        { new: true }
      );
      return res.status(201).send({ status: "SUCCESS", data: cart });
    }

    newCart = {
      userId,
      items,
      totalPrice,
      totalItems,
    };

    createCart = await cartModel.create(newCart);

    res.status(201).send({ status: "SUCCESS", data: createCart });
  } catch (error) {
    res.status(500).send({ status: "false", msg: error.message });
  }
};


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







const updateCart = async (req, res) => {
  try {
    const userId = req.params.userId;
    const requestBody = req.body;
    if (req.userId !== userId) {
      return res.status(401).send({ status: false, msg: "you are not authorized" })
    }
    if (!isValidObjectId(userId)) {
      return res.status(400).send({ status: false, msg: "userid is not valid" })
    }

    if (!validator.isValidRequestBody(requestBody)) {
      return res.status(400).send({ status: false, msg: "enter a body" });
    }
    const { productId, cartId, removeProduct } = requestBody;
    if (!productId) {
      return res.status(400).send({ status: false, message: `product with this product id: ${productId} is not available` })
    }
    if (!isValidObjectId(productId)) {
      return res.status(400).send({ status: false, msg: "productId is not valid" })
    }
    let productPresent = await productModel.findOne({
      _id: productId,
      isDeleted: false,
    });


    if (!productPresent) {
      return res
        .status(404)
        .send({ status: false, message: `product with this id : ${productId} not found` });
    }
    if (!cartId) {
      return res.status(400).send({ status: false, message: `cart with this cart id: ${cartId} is not available` })
    }
    if (!isValidObjectId(cartId)) {
      return res.status(400).send({ status: false, msg: "cartId is not valid" })
    }
    let cartPresent = await cartModel.findOne({
      _id: cartId,
      isDeleted: false,
    });


    if (!cartPresent) {
      return res
        .status(404)
        .send({ status: false, message: `cart with this id : ${cartId} not found` });
    }
    if (!(!NaN(Number(removeProduct)))) {
      return res.status(400).send({ status: false, msg: "remove product is not valid it should be from 0 to 1" })
    }
    if (!((removeProduct === 0) || (removeProduct === 1))) {
      return res.status(400).send({ status: false, msg: "remove product is not valid it should be from 0 to 1" })
    }
    let cart = cartPresent.items
    for (let i = 0; i < cart.length; i++) {
      if (cart[i].productId == productId) {
        let totalProductPrice = cart[i].quantity * productPresent.price //finding how much quantity price
        if (removeProduct === 0) {
          const update = await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { productId: productId }, totalPrice: cartPresent.totalPrice - totalProductPrice, totalItems: cartPresent.totaItems - 1 }, { new: true })
          return res.status(200).send({ status: true, msg: "successfully removed product", data: update })
        }
        if (removeProduct === 1) {
          if (cart[i].quantity === 1 && removeProduct === 1) {


            const removeCart = await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { productId: productId }, totalPrice: cartPresent.totalPrice - totalProductPrice, totalItems: cartPresent.totaItems - 1 }, { new: true })
            return res.status(200).send({ status: true, msg: "successfully removed product & cart is empty", data: removeCart })
          }
          cart[i].quantity = cart[i].quantity - 1
          const updateCart = await cartModel.findByIdAndUpdate({ id: cartId }, { items: cart, totalPrice: cartPresent.totalPrice - productPresent.price }, { new: true });
          return res.status(200).send({ status: true, msg: "successfully decrease product ", data: updateCart })
        }

      }
    }
  } catch (error) {
    return res.status(500), send({ status: false, msg: error.message })
  }
}

//------------------------------------------------------------------3rd api--------------------------------------------------------------------------------



const getcartById = async function (req, res) {
  try {
    const userId = req.params.userId

    if (req.userId !== userId) {
      return res.status(401).send({ status: false, msg: "you are not authorized" })
    }
    if (!isValidObjectId(userId)) {
      return res.status(400).send({ status: false, msg: "invalid userid" })
    }

    const userexist = await userModel.findById({ _id: userId })
    if (!userexist) {
      return res.status(404).send({ status: false, msg: "user doesnot exist" })
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
    const queryParams = req.query;

    if (Validator.isValidInputBody(queryParams)) {
      return res
        .status(404)
        .send({ status: false, message: " page not found" });
    }

    const cartByUserId = await CartModel.findOne({ userId: userId });

    if (!cartByUserId) {
      return res.status(404).send({
        status: false,
        message: `no cart found by ${userId}`,
      });
    }

    const makeCartEmpty = await CartModel.findOneAndUpdate(
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
  addToCart,
  updateCart,
  emptyCart,
  getcartById
}