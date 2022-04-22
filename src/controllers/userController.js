const userModel = require('../model/userModel')
const validator = require('../middleware/validator')
const aws = require('../middleware/aws')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')



//------------------------------------------------1st API --------------------------------------------------------------
const createUser = async (req, res) => {
    try {
        let data = req.body
        if (!validator.isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Please enter your details to register" })
        }

        const { fname, lname, email, phone, password } = data

        if (!validator.isValid(fname)) {
            return res.status(400).send({ status: false, message: "fname is required" })
        }

        if (!validator.char(fname)) {
            return res.status(400).send({ status: false, message: "Please mention valid firstName" })
        }

        if (!validator.validateString(fname)) {
            return res.status(400).send({ status: false, message: "Spaces are not allowed in fname" })
        }

        if (!validator.isValid(lname)) {
            return res.status(400).send({ status: false, message: "lname is required" })
        }

        if (!validator.char(lname)) {
            return res.status(400).send({ status: false, message: "Please mention valid lastname" })
        }

        if (!validator.validateString(lname)) {
            return res.status(400).send({ status: false, message: "Spaces are not allowed in lname" })
        }

        if (!validator.isValid(email)) {
            return res.status(400).send({ status: false, message: "Email is required" })
        }

        if (!validator.isRightFormatemail(email)) {
            return res.status(400).send({ status: false, message: "Please enter a valid email" })
        }

        let uniqueEmail = await userModel.findOne({ email: email })
        if (uniqueEmail) {
            return res.status(400).send({ status: false, message: "Email already exists" })
        }

        let files = req.files
        if (files && files.length > 0) {
            var uploadedFileURL = await aws.uploadFile(files[0])
            data['profileImage'] = uploadedFileURL
        }
        else {
            return res.status(400).send({ status: false, message: "profileImage is required" })
        }

        if (!validator.isValid(phone)) {
            return res.status(400).send({ status: false, message: "phone number is required" })
        }

        if (!validator.isvalidPhoneNumber(phone)) {
            return res.status(400).send({ status: false, message: "Please enter a valid phone" })
        }

        let uniquephone = await userModel.findOne({ phone: phone })
        if (uniquephone) {
            return res.status(400).send({ status: false, message: "phone already exists" })
        }

        if (!validator.isValid(password)) {
            return res.status(400).send({ status: false, message: "Password is required" })
        }

        if (password.length < 8 || password.length > 15) {
            return res.status(400).send({ status: false, message: "The length of password should be in between 8-15 characters" })
        }

        if (!validator.validateString(password)) {
            return res.status(400).send({ status: false, message: "Spaces are not allowed in password" })
        }

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);
        data.password = hashedPassword


        if(!data.address || Object.keys(data.address).length==0){
            return res.status(400).send({ status: false, message: "Please provide the Address" }) 
        }

        const address = JSON.parse(data.address) 
        
        if(!address.shipping || (address.shipping &&(!address.shipping.street||!address.shipping.city||!address.shipping.pincode))){
            return res.status(400).send({ status: false, message: "Shipping address is required " })
        }

        if (!validator.isValidPinCode(address.shipping.pincode)) {
            return res.status(400).send({ status: false, message: "Please provide the valid pincode in Shipping Address" })    
        }

        if(!address.billing || (address.billing &&(!address.billing.street||!address.billing.city||!address.billing.pincode))){
            return res.status(400).send({ status: false, message: "billing address is required " })
        }
        
        if (!validator.isValidPinCode(address.billing.pincode)) {
            return res.status(400).send({ status: false, message: "Please provide the valid pincode in Billing Address" })   
        }

        const user = {
            fname,
            lname,
            email,
            profileImage: data.profileImage,
            phone,
            password:data.password,
            address: {
                shipping: {
                    street: address.shipping.street,
                    city: address.shipping.city,
                    pincode: address.shipping.pincode
                },
                billing: {
                    street: address.billing.street,
                    city: address.billing.city,
                    pincode: address.billing.pincode
                }
            }
        }

        let UserData = await userModel.create(user)
        return res.status(201).send({ status: true, message: "You're registered successfully", data: UserData })
    }

    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}



//-------------------------------------------------------------2nd api------------------------------------------------------------------------------------------------



const loginUser = async function (req, res) {
    try {
        let body = req.body
        let { email, password } = body
        //--------------------------------validation starts------------------------------
        if (!validator.isValidRequestBody(email)) {
            res.status(400).send({ status: false, msg: "plese pass required parameters" })
            return
        }
        if (!validator.isValid(email)) {
            res.status(400).send({ status: false, msg: "Email is required" })
            return
        }
        if (!validator.isRightFormatemail(email)) {
            return res.status(404).send({ status: false, msg: "Invalid Email" })

        }

        if (!validator.isValid(password)) {
            res.status(400).send({ status: false, msg: "Password is required" })
            return
        }
        


        //-------------------------validation ends--------------------------------------------
        let user=await userModel.findOne({email:email})
        if(!user){
            return res.status(400).send({status:false,msg:"please provide email and password"})
        }
        const encryptedPassword = await bcrypt.compare(body.password, user.password)

            if (!encryptedPassword) {
                return res.status(400).send({ status: false, msg: 'password is incorrect' })
            }
        else {
            let token = jwt.sign({
                userId: user._id,
                iat: new Date().getTime()/1000, 
                }, "secret", { expiresIn: "60m" })
            res.header("x-api-key", token)
            res.status(200).send({ status: true, msg: "user login successfull", data:{userId:user._id,token} })

        }
    } catch (error) {
        console.log(error)
        res.status(500).send({ msg: error.message })

    }
}


//---------------------------------------------------3rd api-----------------------------------------------------
const getUserById = async (req, res) => {
    try {

        const userId = req.params.userId
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "userId is required in params" })
        }

       
        if(!validator.isValid(userId)){
            return res.status(400).send({ status: false, msg: "userId is required in params" })

        }


        //-------------authorization----------
        if (req.userId !== userId) {
            return res.status(401).send({ status: false, msg: "you are not authorized ,userId is not right" })
        }

        //---------finding document-----------
        const profileMatch = await userModel.findOne({ _id: userId })
        if (!profileMatch) {
            return res.status(404).send({ status: false, message: 'this userId is nt present in DB' })
        }
        return res.status(200).send({ status: true, message: 'profile details', data: profileMatch })

    } catch (error) {
        return res.status(500).send({ success: false, error: error.message });
    }
}








//-----------------------------------------------4th api------------------------------------------------------------------------------------






const updateProfile = async function (req, res) {
    try {
        let userId = req.params.userId
        let userIdFromToken = req.userId
        if (!userId) { return res.status(400).send({ status: false, message: "userid required" }) }

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "UserId not a valid ObjectId" })
        }

        let userData = await userModel.findById(userId)
        if (!userData) {
            return res.status(404).send({ status: false, message: "User not present in the collection" })
        }

        if (userId != userIdFromToken) {
            return res.status(403).send({ status: false, message: "User is not Authorized" })
        }
        let data = req.body
        const { fname, lname, email, phone, password} = data

        let updatedData = {}

        if (validator.isValid(fname)) {
            if (!validator.char(fname)) {
                return res.status(400).send({ status: false, message: "Please mention valid firstName" })
            }

            if (!validator.validateString(fname)) {
                return res.status(400).send({ status: false, message: "Spaces are not allowed in fname" })
            }
            updatedData['fname'] = fname
        }

        if (validator.isValid(lname)) {
            if (!validator.char(lname)) {
                return res.status(400).send({ status: false, message: "Please mention valid lastname" })
            }

            if (!validator.validateString(lname)) {
                return res.status(400).send({ status: false, message: "Spaces are not allowed in lname" })
            }
            updatedData['lname'] = lname
        }

        if (email) {
            if (!validator.validateEmail(email)) {
                return res.status(400).send({ status: false, msg: "Invalid Email address" })
            }
            let dupEmail = await userModel.findOne({ email })
            if (dupEmail) {
                return res.status(404).send({ status: false, message: "email already present" })
            }
            updatedData['email'] = email
        }

        let files = req.files
        if (files && files.length > 0) {
            let uploadedFileURL = await s3.uploadFile(files[0])
            data['profileImage'] = uploadedFileURL
            updatedData['profileImage'] = data.profileImage
        } else {

            updatedData['profileImage'] = userData.profileImage

        }

        if (phone) {
            if (!validator.isvalidPhoneNumber(phone)) {
                return res.status(400).send({ status: false, msg: "Invalid PhoneNumber" })
            }
            let dupPhone = await userModel.findOne({ phone })
            if (dupPhone) {
                return res.status(404).send({ status: false, message: "phone already present" })
            }
            updatedData['phone'] = phone
        }

        if (password) {
            if (password.length < 8 || password.length > 15) {
                return res.status(400).send({ status: false, message: "The length of password should be in between 8-15 characters" })
            }
            if (!validator.validateString(password)) {
                return res.status(400).send({ status: false, message: "Spaces are not allowed in password" })
            }

            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(password, salt);
            data.password = hashedPassword

            updatedData['password'] = data.password
        }

        if (data.address) {
            const address=JSON.parse(data.address)
            if(Object.keys(address).length>0){
                const shippingAdress=address.shipping
            if (shippingAdress) {

                if (shippingAdress.street) {
                    updatedData['address.shipping.street'] = shippingAdress.street
                }
                if (shippingAdress.city) {
                    if (!validator.char(address.shipping.city)) {
                        return res.status(400).send({ status: false, message: "Please mention valid shipping city" })
                    }
                    updatedData['address.shipping.city'] = shippingAdress.city
                }
                if (shippingAdress.pincode) {

                    if (!validator.isValidPinCode(shippingAdress.pincode)) {
                        return res.status(400).send({ status: false, message: "Pincode should be numeric and length is 6" })
                    }
                    updatedData['address.shipping.pincode'] = shippingAdress.pincode

                }
            }
            if (validator.isValid(address.billing)) {

                if (validator.isValid(address.billing.street)) {
                    updatedData['address.billing.street'] = address.billing.street
                }
                if (validator.isValid(address.billing.city)) {
                    if (!validator.char(address.billing.city)) {
                        return res.status(400).send({ status: false, message: "Please mention valid billing city" })
                    }
                    updatedData['address.billing.city'] = address.billing.city
                }
                if (validator.isValid(address.billing.pincode)) {

                    if (!validator.isValidPinCode(address.billing.pincode)) {
                        return res.status(400).send({ status: false, message: "Pincode should be numeric and length is 6" })
                    }
                    updatedData['address.billing.pincode'] = address.billing.pincode
                }
            }
        }
        }

        if (!validator.isValidRequestBody(data) && !files) {
            return res.status(400).send({ status: true, message: "No data passed to modify the user profile" })
        }
        
        let updatedDetails = await userModel.findByIdAndUpdate(userId, updatedData , { new: true })
        return res.status(200).send({ status: true, message: "User profile updated", data: updatedDetails })

    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: error.message })
    }
}









module.exports = {
    createUser,
    loginUser,
    getUserById,
    updateProfile

}
