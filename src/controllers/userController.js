const userModel = require('../model/userModel')
const validator = require('../middleware/validator')
const aws = require('../middleware/aws')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const ObjectId = require('mongoose').Types.ObjectId;




// const isValid=function (value){
//     if(typeof value ==="undefined"||typeof value ==="null") return false
//     if(typeof value ==="string" && typeof value.trim.length ===0) return false
//     return true
// }


//------------------------------------------------1st API --------------------------------------------------------------
const userCreate = async (req, res) => {
    try {
        let files = req.files;
        let data = req.body;
        let { fname, lname, email, phone, password, address } = data



        //-------------------------------------validation starts-----------------------------------------------------------------------------
        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, msg: "Parameter is required" })
        }
        if (!validator.isValid(fname)) {
            return res.status(400).send({ status: false, msg: "fname is required" })
        }
        if (!validator.isValid(lname)) {
            return res.status(400).send({ status: false, msg: "lname is required" })
        }
        //---------------email validation--------------
        if (!validator.isValid(email)) {
            return res.status(400).send({ status: false, msg: "email is required" })
        }
        if (!validator.isRightFormatemail(email)) {
            return res.status(404).send({ status: false, msg: "Invalid Email" })

        }
        let isEmailAlreadyUsed = await userModel.findOne({ email })
            if (isEmailAlreadyUsed) {
                return res.status(400).send({ status: false, msg: "Email Already Exists" })

            }

        //---------------phone-no validation--------------
        if (!validator.isValid(phone)) {
            return res.status(400).send({ status: false, msg: 'phone no is required' })
        }

        if (!validator.isvalidPhoneNumber(phone)) {
            res.status(400).send({ status: false, msg: "Phone no is not valid " })
            return
        }
        let isPhoneAlreadyUsed = await userModel.findOne({ phone })
            if (isPhoneAlreadyUsed) {
                return res.status(400).send({ status: false, msg: "Phone number Already Exists" })

            }

        //--------------password validation----------------
        if (!validator.isValid(password)) {
            res.status(400).send({ status: false, msg: "password is required" })
            return
        }
        // let size = Object.keys(password.trim()).length
        // if (size < 8 || size > 15) {
        //     return res.status(400).send({ status: false, message: "Please provide password with minimum 8 and maximum 14 characters" });;
        // }
        if (!validator.isRightpassword(password)) {
            res.status(400).send({ status: false, msg: "Please enter Minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character" })
            return
        }


        //---password decrpting---
        const salt = await bcrypt.genSalt(10)
            password = await bcrypt.hash(password, salt)


        //------------------------address validation--------------
        if (!validator.isValid(address)) {
            return res.status(400).send({ status: false, msg: "address is required" })
        }
        if (address) {
            if (address.shipping) {
                if (!validator.isValid(address.shipping.street)) {
                    res.status(400).send({ status: false, Message: "Please provide street name in shipping address" })
                    return
                }
                if (!validator.isValid(address.shipping.city)) {
                    res.status(400).send({ status: false, Message: "Please provide city name in shipping address" })
                    return
                }
                if (!validator.isValid(address.shipping.pincode)) {
                    res.status(400).send({ status: false, Message: "Please provide pincode in shipping address" })
                    return
                }
            }
            if (address.billing) {
                if (!validator.isValid(address.billing.street)) {
                    res.status(400).send({ status: false, Message: "Please provide street name in billing address" })
                    return
                }
                if (!validator.isValid(address.billing.city)) {
                    res.status(400).send({ status: false, Message: "Please provide city name in billing address" })
                    return
                }
                if (!validator.isValid(address.billing.pincode)) {
                    res.status(400).send({ status: false, Message: "Please provide pincode in billing address" })
                    return
                }
            }


            
            

            //-------------------------------------------------------validation ends--------------------------------------------------------------------

            //-----------------------------------------------------uploading image to AWS-------------------------------------------------------


            profileImage = await aws.uploadFile(files[0]);
            




            //----------------------------------------------------creating user document------------------------------------------------------

            let data = { fname, lname, email, phone, password, address, profileImage }

            const createUserData = await userModel.create(data)
            return res.status(201).send({
                status: true,
                message: "user created successfully",
                data: createUserData
            });


        }


    } catch (err) {
        return res.status(500).send({
            status: false,
            message: err.message
        })
    }

}



//-------------------------------------------------------------2nd api------------------------------------------------------------------------------------------------



const loginUser = async function (req, res) {
    try {
        let body = req.body
        let { email, password } = body
        //--------------------------------validation starts------------------------------
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
        let userDetails = await userModel.findOne({ email,  password })
        if (!userDetails) {
            return res.status(400).send({ status: false, msg: "please provide email and password" })
        }
        else {
            let token = jwt.sign({
                userId: userDetails._id,
                iat: new Date().getTime()/1000, 
                }, "Secret-Key", { expiresIn: "60m" })
            res.header("x-api-key", token)
            res.status(201).send({ status: true, msg: "user login successfull", userId:userDetails._id,data: token })

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
        if (Object.keys(userId).length == 0) {
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






const updateProfile = async (req, res) => {
    try {
        const userId = req.params.userId
        if (Object.keys(userId).length == 0) {
            return res.status(400).send({ status: false, msg: "userId is required in params" })
        }

        //---------authorisation-------
        if (req.userId != userId) {
            return res.status(400).send({ status: false, msg: "you are not authorized" })
        }
        
        const findUserProfile = await userModel.findOne({ _id: userId })
        if (!findUserProfile) {
            return res.status(400).send({
                status: false,
                message: `User doesn't exists by ${userId}`
            })
        }
        let data = req.body
        let files = req.files
        if (!validator.isValidRequestBody(data)) {
            return res.status(400).send({
                status: false,
                message: "Invalid request parameters. Please provide user's details to update."
            })
        }
        if (files) {
            if (validator.isValidRequestBody(files)) {
                if (!(files && files.length > 0)) {
                    return res.status(400).send({ status: false, message: "Invalid request parameter, please provide profile image" })
                }
                
            }
        }
        let profileImage = await aws.uploadFile(files[0])
        
        let { fname, lname, email, password, address } = data

        if (!validator.isValid(fname)) {
            return res.status(400).send({ status: false, message: 'fname is Required' })
        }

        if (!validator.isValid(lname)) {
            return res.status(400).send({ status: false, message: 'lname is Required' })
        }
        if (email) {
            if (!validator.isValid(email)) {
                return res.status(400).send({ status: false, message: "Invalid request parameter, please provide email" })
            }
            if (!/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email)) {
                return res.status(400).send({ status: false, message: `Email should be a valid email address` });
            }
            let isEmailAlredyPresent = await userModel.findOne({ email: email })
            if (isEmailAlredyPresent) {
                return res.status(400).send({ status: false, message: `Unable to update email. ${email} is already registered.` });
            }
        }
        if (phone) {
            if (!validator.isValid(phone)) {
                return res.status(400).send({ status: false, message: "Invalid request parameter, please provide Phone number." })
            }
            if (!/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/.test(phone)) {
                return res.status(400).send({ status: false, message: `Please enter a valid Indian phone number.` });
            }
            let isPhoneAlredyPresent = await userModel.findOne({ phone: phone })
            if (isPhoneAlredyPresent) {
                return res.status(400).send({ status: false, message: `Unable to update phone. ${phone} is already registered.` });
            }
        }

        if (password) {
            if (!validator.isValid(password)) {
                return res.status(400).send({ status: false, message: "Invalid request parameter, please provide password" })
            }
            if (!(password.length >= 8 && password.length <= 15)) {
                return res.status(400).send({ status: false, message: "Password should be Valid min 8 and max 15 " })
            }
            
             //var password = await bcrypt.hash(password, saltRounds)
            const salt = await bcrypt.genSalt(10);
            password = await bcrypt.hash(password, salt);
        }
        let updateAddress = await userModel.findOne({ _id: userId })
        if (!updateAddress) {
            return res.status(400).send({ status: false, message: "This userId does not exist" });;
        }
        updateAddress.address
        if (address) {
            if (address.shipping) {
                if (address.shipping.street) {
                    updateAddress.address.shipping.street = address.shipping.street
                }
                if (address.shipping.city) {
                    updateAddress.address.shipping.city = address.shipping.city
                }
                if (address.shipping.pincode) {
                    updateAddress.address.shipping.pincode = address.shipping.pincode
                }
            }
            if (address.billing) {
                if (address.billing.street) {
                    updateAddress.address.billing.street = address.billing.street
                }
                if (address.billing.city) {
                    updateAddress.address.billing.city = address.billing.city
                }
                if (address.billing.pincode) {
                    updateAddress.address.billing.pincode = address.billing.pincode
                }
            }
        }
        let updateProfile = await userModel.findOneAndUpdate({ _id: userId },
            { fname, lname, email, password, profileImage, address: updateAddress.address }, { new: true })
        return res.status(200).send({ status: true, message: "user profile update successfull", data: updateProfile })
    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, msg: err.message })
    }
}




// const updateUser = async function (req, res) {

//     try {
            
//         let data=req.body
//         let files = req.files;

//         const userId = req.params.userId

        

//         if (req.userId!=userId) {
//             return res.status(400).send({ status: false, msg: "you are not authorized" })
//         }


//         const { fname, lname, email, phone, password, address } = data
//         const emptyobj = {}

//         if (fname) {
//             if (!validator.isValid(fname)) {
//                 res.status(400).send({ status: false, Message: "please provide fname" })
//                 return
//             }
//             emptyobj.fname = fname
//         }

//         if (lname) {
//             if (!validator.isValid(lname)) {
//                 res.status(400).send({ status: false, Message: "please give lname" })
//                 return
//             }
//             emptyobj.lname = lname
//         }
        
//         if(!validator.isValid(email)){
//             return res.status(400).send({status:false,msg:"email is required"})
//         }
         
//         if (email) {
//             if (!(/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email))) {
//                 return res.status(400).send({ status: false, msg: 'enter valid email' })
//             }

          

//             const dubEmail = await userModel.findOne({ email: email });

//             if (dubEmail) {
//                 res.status(400).send({ status: false, message:"email is already exist"})
//                 return
//             }
//             emptyobj.email = email
//         }
//         if(!validator.isValid(phone)){
//             return res.status(400).send({status:false,msg:"phone is required"})
//         }
//         if (phone) {
//             if (!(/^\d{10}$/.test(phone))) {
//                 res.status(400).send({ status: false, message: "phone no should be a valid phone no"})
//                 return
//             }
//             const dubPhone = await userModel.findOne({ phone: phone });

//             if (dubPhone) {
//                 res.status(400).send({ status: false, message:   "phone is already registered" })
//                 return
//             }
//             emptyobj.phone = phone
//         }

//         if (password) {
//             if(!validator.isValid(password)){
//                 return res.status(400).send({status:false,msg:"password is rquired"})
//             }
//             if (password.length > 15) {
//                 return  res.status(400).send({ status: false, msg: "Password should be less than 15 characters"})
                  
//               }
//               if (password.length < 8) {
//                 return  res.status(400).send({ status: false, msg: "Password should be more than 8 characters"})
                  
//               }

//             const encryptedPassword = await bcrypt.hash(password, 10)

//             emptyobj.password = encryptedPassword

//         }
        

//         if (validator.isValid(files)) {
//             profileImage = await aws.uploadFile(files[0]);
//             emptyobj.profileImage = profileImage

//         }

//         if (address) {

//             if (address.shipping) {

//                 if (address.shipping.street) {

//                     if (!validator.isValid(address.shipping.street)) {
//                         res.status(400).send({ status: false, Message: "Please provide street in shipping" })
//                         return
//                     }
//                     emptyobj["address.shipping.street"] = address.shipping.street
//                 }

//                 if (address.shipping.city) {
//                     if (!validator.isValid(address.shipping.city)) {
//                         res.status(400).send({ status: false, Message: "Please provide city in shipping" })
//                         return
//                     }
//                     emptyobj["address.shipping.city"] = address.shipping.city
//                 }

//                 if (address.shipping.pincode) {
//                     if (!validator.isValid(address.shipping.pincode)) {
//                         res.status(400).send({ status: false, Message: "Please provide in shipping" })
//                         return
//                     }
//                     emptyobj["address.shipping.pincode"] = address.shipping.pincode
//                 }

//             }

//             if (address.billing) {

//                 if (address.billing.street) {

//                     if (!validator.isValid(address.billing.street)) {
//                         res.status(400).send({ status: false, Message: "Please provide street in billing" })
//                         return
//                     }
//                     emptyobj["address.billing.street"] = address.billing.street
//                 }

//                 if (address.billing.city) {
//                     if (!validator.isValid(address.billing.city)) {
//                         res.status(400).send({ status: false, Message: "Please provide city  in billing" })
//                         return
//                     }

//                     emptyobj["address.billing.city"] = address.billing.city
//                 }

//                 if (address.billing.pincode) {

//                     if (!validator.isValid(address.billing.pincode)) {
//                         res.status(400).send({ status: false, Message: "Please provide pincode in billing address" })
//                         return
//                     }

//                     emptyobj["address.billing.pincode"] = address.billing.pincode
//                 }

//             }
//         }

//         const userupdate = await userModel.findOneAndUpdate({ _id:userId }, emptyobj, { new: true })

//         res.status(200).send({ status: true, message: "updated sucessfully", data: userupdate });
//     }
//     catch (error) {
//         res.status(500).send({ status: false, Message: error.message })
//     }
// }



module.exports = {
    userCreate,
    loginUser,
    getUserById,
    updateProfile

}
