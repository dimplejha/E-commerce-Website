const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')
const productController = require('../controllers/productController')
const cartController = require('../controllers/cartController')
const mv = require('../middleware/auth.js')



//---------------------------------------------User api----------------------------------
router.post('/register',userController.userCreate)
router.post('/login',userController.loginUser)
router.get('/user/:userId/profile',mv.userAuth,userController.getUserById)
router.put('/user/:userId/profile',mv.userAuth,userController.updateProfile)



//--------------------------------------------product api--------------------------------
router.post('/products',productController.createProduct)
router.get('/products',productController.getProductsByfilter)
router.get('/products/:productId',productController.getproductsById)
router.put('/products/:productId',productController.updatedProductById)
router.delete('/products/:productId',productController.deleteproductById)


//-----------------------------------------------cart api---------------------------------
router.post('/users/:userId/cart',cartController.addToCart)
router.put('/users/:userId/cart',cartController.updateCart)
router.get('/users/:userId/cart',cartController.emptyCart)
router.delete('/users/:userId/cart',cartController.getcartById)












module.exports = router;
