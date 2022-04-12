const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')
const productController = require('../controllers/productController')

const mv = require('../middleware/auth.js')



//---------------------------------------------User api----------------------------------
router.post('/register',userController.userCreate)
router.post('/login',userController.loginUser)
router.get('/user/:userId/profile',mv.userAuth,userController.getUserById)
router.put('/user/:userId/profile',mv.userAuth,userController.updateProfile)



//--------------------------------------------product api--------------------------------
router.post('/products',productController.productCreation)







module.exports = router;
