const mongoose = require('mongoose')



const isValid = function(value) {
    if (typeof value === 'undefined' || value === null) return false 
    if (typeof value === 'string' && value.trim().length === 0) return false 
    return true;
};

const isValidRequestBody = function(requestBody) {
    return Object.keys(requestBody).length > 0; 
};

const isRightFormatemail = function (email) {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
}

const isvalidPhoneNumber = function(phone){
    return /^[6-9]\d{9}$/.test(phone)
}

 //     At least one upper case English letter, (?=.*?[A-Z])
      // At least one lower case English letter, (?=.*?[a-z])
      // At least one digit, (?=.*?[0-9])
      // At least one special character, (?=.?[#?!@$%^&-])
      // Minimum eight in length .{8,} (with the anchors)
 const isRightpassword=function(password){
     return /^(?=.[0-9])(?=.[A-Z])(?=.[a-z])(?=.[!@#$%^&])[a-zA-Z0-9!@#$%^&]{8,16}$/.test(password)
        
 }







module.exports = {
    isValid,
    isValidRequestBody,
    isRightFormatemail,
    isvalidPhoneNumber,
    isRightpassword
}