const userModel = require('../model/userModel')
const validator = require('../middleware/validator')
const aws = require('../middleware/aws')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')



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
        let { fname, lname, email,phone, password, address } = data
        //password=password.trim()
        

        // const salt=await bcrypt.genSalt(10)
        // password=await bcrypt.hash(password,salt)
        //console.log(password.length)



        //-------------------------------------validation starts-----------------------------------------------------------------------------
        // if (Object.keys(data).length == 0) {
        //     return res.status(400).send({ status: false, msg: "Parameter is required" })
        // }
        let size = Object.keys(password.trim()).length
        if (size < 8 || size > 15) {
            return res.status(400).send({ status: false, message: "Please provide password with minimum 8 and maximum 14 characters" });;
        }
        console.log(size)
        

        

        if (!validator.isValid(fname)) {
            return res.status(400).send({ status: false, msg: "fname is required" })
        }
        if (!validator.isValid(lname)) {
            return res.status(400).send({ status: false, msg: "lname is required" })
        }
        if (!validator.isValid(email)) {
            return res.status(400).send({ status: false, msg: "email is required" })
        }
        if (!(/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email))) {
            return res.status(404).send({ status: false, msg: "Invalid Email" })

        }
        if (!validator.isValid(phone)) {
            return res.status(400).send({ status: false, msg: 'phone no is required' })
        }

        if (!(/^\d{10}$/.test(phone))) {
            res.status(400).send({ status: false, msg: "Phone no must  be of 10 digits" })
            return
        }
        // if (!validator.isValid(password)) {
        //     return res.status(400).send({ status: false, msg: "password is required" })
        // }
        // if (password.trim().length > 15) {
        //     return res.status(400).send({ status: false, msg: "Password length must be less than 15 characters" })

        // }
        // if (password.trim().length < 8) {
        //     return res.status(400).send({ status: false, msg: "Password length must be more than 8 characters" })

        // }
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


            let isEmailAlreadyUsed = await userModel.findOne({ email })
            if (isEmailAlreadyUsed) {
                return res.status(400).send({ status: false, msg: "Email Already Exists" })

            }
            let isPhoneAlreadyUsed = await userModel.findOne({ phone })
            if (isPhoneAlreadyUsed) {
                return res.status(400).send({ status: false, msg: "Phone number Already Exists" })

            }

            //-------------------------------------------------------validation ends--------------------------------------------------------------------

            //-----------------------------------------------------uploading image to AWS-------------------------------------------------------


            profileImage = await aws.uploadFile(files[0]);
            const salt=await bcrypt.genSalt(10)
        password=await bcrypt.hash(password,salt)




            //----------------------------------------------------creating user document------------------------------------------------------

            let data={ fname, lname, email,phone, password, address ,profileImage} 

            const createUserData = await userModel.create(data)
            return res.status(201).send({
                status: true,
                message: "user created successfully",
                data: createUserData
            });


        }


        }catch (err) {
            return res.status(500).send({
                status: false,
                message: err.message
            })
        }

    }



//-------------------------------------------------------------2nd api------------------------------------------------------------------------------------------------



const loginUser=async function(req,res){
    try {
        let body=req.body
        let {email,password}=body
        //--------------------------------validation starts------------------------------
        if (!validator.isValid(email)) {
            res.status(400).send({ status: false, msg: "Email is required" })
            return
        }
        if (!(/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email))) {
            res.status(400).send({ status: false, msg: "email should have valid email address" })
            return
        }
        
        if (!validator.isValid(password)) {
            res.status(400).send({ status: false, msg: "Password is required" })
            return
        }

        //-------------------------validation ends--------------------------------------------
        let userDetails=await userModel.findOne({email:email,password:password})
        if(!userDetails){
            return res.status(400).send({status:false,msg:"please provide email and password"})
        }
        else{
            let token=jwt.sign({userId:userDetails._id,
                

            },"project5-group31-shoppingcart",{expiresIn:"60m"})
            res.header("x-api-key",token)
            res.status(201).send({status:true,  msg:"user login sucessfull",data:token})

        }
    } catch (error) {
        console.log(error)
        res.status(500).send({msg:error.message})
        
    }
}


//---------------------------------------------------3rd api-----------------------------------------------------
const getuserById = async (req, res) => {
    try {
        
        const userId = req.params.userId

        const profilematch = await userModel.findOne({ _id: userId })
        if(!req.userId==profilematch.userId){
            return res.status(401).send({status:false,msg:"you are not authorized"})
        }

        if (!profilematch) {
            return res.status(404).send({ status: false, message: ' profile  does not found' })
        }
        return res.status(200).send({ status: true, message: 'profile details', data:profilematch })
      
    } catch (error) {
        return res.status(500).send({ success: false, error: error.message });
    }
}



module.exports = {
    userCreate,
    loginUser,
    getuserById

}
