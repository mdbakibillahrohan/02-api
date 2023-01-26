/**
 * Title: Passport Schema
 * Discription: This is Passport Schema Module
 * Author: Nazim
 * Data: 25/01/2023
 * 
 */
'use strict'

// // Dependencies 
const  Joi = require('joi')

// Passport Schema 
const passportSchema =  Joi.object({
     oid :  Joi.string() ,
     passengerid :  Joi.string() ||  Joi.number(),
     fullname :  Joi.string(),
     surname :   Joi.string() ,
     givenname :   Joi.string(),
     gender :   Joi.string() ,
     mobileno :  Joi.string() ||  Joi.number(),
     email :  Joi.string().required(),
     nationality :  Joi.string() ,
     countrycode :  Joi.string() ,
     birthregistrationno : Joi.string(),
     personalno :  Joi.string() ,
     passportnumber :  Joi.string() ,
     previouspassportnumber : Joi.string(),
     birthdate :  Joi.string() ,
     passportissuedate :  Joi.string() ,
     passportexpirydate :  Joi.string() ,
     passportimagepath :  Joi.string() ,
     issuingauthority :  Joi.string() ,
     description : Joi.string(),
     status :  Joi.string() ,
     createdby :  Joi.string() ,
     createdon :  Joi.string() ,
     editedby : Joi.string(),
     editedon : Joi.string(),
     countryoid : Joi.string(),
     customeroid :  Joi.string(),
     companyoid :  Joi.string()
})

// Module Export 
module.exports = { passportSchema }