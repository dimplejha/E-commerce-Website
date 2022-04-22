const mongoose = require('mongoose')



const isValid = function(value) {
    if (typeof value === 'undefined' || value === null) return false 
    if (typeof value === 'string' && value.trim().length === 0) return false 
    return true;
};

const isValidRequestBody = function(requestBody) {
    return Object.keys(requestBody).length > 0; 
};

const char = function (value) {
    return /^[A-Za-z\s]+$/.test(value)
}

const validateString = function (value) {
    return /^\S*$/.test(value)
}
const isRightFormatemail = function (email) {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
}

const isvalidPhoneNumber = function(phone){
    return /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/.test(phone)
}


 const isValidObjectId = function (ObjectId) {
    return mongoose.Types.ObjectId.isValid(ObjectId)
}


const isValidateSize = function (value) {
    return ["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(value) != -1
}

const validEnum = function (value) {
    let enumValue = ["S", "XS", "M", "X", "L", "XXL", "XL"]
    for (let a of value) {
        if (enumValue.includes(a) == false) {
            return false
        }
    }
    return true;
}

const isValidPrice = function(value){
    if(!(/^\d{0,8}(\.\d{1,2})?$/.test(value.trim()))){
        return false
    }
    return true
}
const isValidInstallments=function(installments){
    return /^[1-9]{1,15}$/.test(installments)
}

const isValidPinCode = function(value){
    if(!(/^[1-9][0-9]{5}$/.test(value.trim()))){
        return false
    }
    return true
}

const isValidCurrencyFormat = function (currencyFormat) {
    return ['₹'].indexOf(currencyFormat) !== -1
}


const isValidNumber = function (value) {
    if (!isNaN(value)) return true
}





module.exports = {
    isValid,
    isValidRequestBody,
    char,
    validateString,
    isRightFormatemail,
    isvalidPhoneNumber,
    isValidObjectId,
    isValidateSize,
    validEnum,
    isValidPrice,
    isValidInstallments,
    isValidPinCode,
    isValidCurrencyFormat,
    isValidNumber
}