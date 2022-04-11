const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')
const mv = require('../middleware/auth.js')




router.post('/register',userController.userCreate)
router.post('/login',userController.loginUser)
router.get('/user/:userId/profile',userController.getuserById)





module.exports = router;
