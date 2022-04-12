// // const jwt = require('jsonwebtoken')



// // const authenticate=async function (req,res,next){
// //     try{
// //     let token=req.headers["x-api-key"]
// //     if(!token){
// //         return res.status(400).send({status:false,msg:"token is required"})
// //     }
// //     let decodetoken=jwt.verify(token,"project5-group31-shoppimgcart")
// //     if(!decodetoken){
// //         return res.status(400).send({status:false,msg:"please enter the right token"})
// //     }

// //       req.userId=decodetoken.userId

// //      next()
    
// //     }
// //    catch(error){
// //        return res.status(500).send({status:false,msg:error.message})

// //    }

// // }



// const jwt = require("jsonwebtoken")
// const userModel = require("../model/userModel")

// const authentication = async function (req, res, next) {
//     try {

//         token = req.headers["authorization"]
//         if (!token) {
//             return res.status(401).send({ status: false, message: "token required" })
//         }
//          if(token.startsWith('Bearer')){
//              token=token.slice(7,token.length)
//          }
//         //const token = req.header('Authorization', 'Bearer Token')

//         //let token = req.headers["x-api-key"];
//         //if (!token) return res.status(400).send({ status: false, msg: "login is required" })
//         let decodedtoken = jwt.verify(token, "Secret-Key")
//         if (!decodedtoken) return res.status(401).send({ status: false, msg: "token is invalid" })

//         next()
//     }
//     catch (error) {
//         console.log(error)
//         return res.status(500).send({ msg: error.message })
//     }
// }


// const authorisation = async function (req, res, next) {
//     try {
//         const token = req.header('Authorization', 'Bearer Token')

//         //let token = req.headers["x-api-key"]
//         let decodedToken = jwt.verify(token, "Secret-Key")
//         let data = req.params.userId
//         if (userId) {
//             let userFound = await userModel.findById(data).select({ userId: 1 })
//             userId = userFound.userId
            
//             if (userId != decodedToken.userId) {
                
//                 return res.status(403).send({ status: false, message: "user not authorised" })
//             }
//         }
//         else {
//             let data = req.body.userId
//             if (decodedToken.userId != data) {
//                 return res.status(403).send({ status: false, message: "user not authorised to perform task" })
//             }
//         }
//         next()
//     }
//     catch (error) {
//         console.log(error)
//         return res.status(500).send({ msg: error.message })
//     }
// }



// module.exports.authentication = authentication;
// module.exports.authorisation = authorisation;




const jwt = require('jsonwebtoken')

const userAuth = async(req, res, next) => {
    try {
        const token = req.header('Authorization', 'Bearer Token')
        if (!token) {
            return res.status(403).send({ status: false, message: `Missing authentication token in request` })
        }
        let splitToken = token.split(' ')

        let decodeToken = jwt.decode(splitToken[1], 'secret')
        if (!decodeToken) {
            return res.status(403).send({ status: false, message: `Invalid authentication token in request ` })
        }
        if (Date.now() > (decodeToken.exp) * 1000) {
            return res.status(404).send({ status: false, message: `Session Expired, please login again` })
        }
        req.userId = decodeToken.userId
        next()
    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}
module.exports = {
    userAuth
}
