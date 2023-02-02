/**
 * Title: Create Passport 
 * Description: Create New Passport 
 * Author: Nazim
 * Date: 25/01/2023
 * 
 */
'use strick'

// Dependencies 
const  Joi = require('joi')
const uuid = require('uuid')
const log = require("../../util/log");
const Dao = require("../../util/dao");
const Helper = require("../../util/helper");
const { API , TABLE } = require("../../util/constant");

// Playload schema 
const payload_scheme =  Joi.object({
     passengerid :  Joi.string(),
     fullname :  Joi.string(),
     surname :   Joi.string() ,
     givenname :   Joi.string(),
     gender :   Joi.string() ,
     mobileno :  Joi.string() ,
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

// Router controller object 
const router_controller = {
    method: 'POST',
    path: API.CONTEXT + API.CREATE_PASSPORT,
    options: {
    auth: {
        mode: "required",
        strategy: "jwt",
    },
    description: "Create new passport ",
    plugins: {
        hapiAuthorization: {
            validateEntityAcl: false,
            validateAclMethod: 'isGranted',
            aclQuery: async (id, request) => {
                return {
                    isGranted: async (passport, role) => { 
                        return await Helper.is_granted(request, API.CREATE_PASSPORT)
                    }
                }
            }
        }
      },
    validate: {
        payload: payload_scheme,
        options: {
            allowUnknown: false,
        },
        failAction: async (request, h, err) => {
            return h.response({ code: 301, status: false, message: err?.message }).takeover()
        },
        }
    },
    handler: async (request, h) => {
        log.debug(`Request recived - ${ JSON.stringify( request.payload )}`);
        const response = await handle_request ( request );
        log.debug(`Request send - ${ JSON.stringify( response )}`)
        return h.response(response);               
    }
}

// Handler Request Object 
const handle_request = async ( request ) => {
    let response_from_database = create_new_passport( request );
    if( !response_from_database ) {
        log.info('create new passport failed !');
        return { status: true, code: 201, message: ' create new passport failed ! '}
    }
    log.info( 'Create New Passport Done' );
    return { status: true, code: 200, response: '', message: ' Create New Passport Done '}
}

// Create New Passport Object
const create_new_passport = async ( request ) => {
    let data = null;
    let oid = uuid.v4()
    console.log(oid)
    let sql = {
        text: `INSERT INTO ${TABLE.PASSPORT}(${ 'oid', payload_scheme.keys })VALUES(${ oid, request.payload })`
    }
    for(let [key , value] of Object.entries( request.payload )){

        console.log( key );
        console.log( value );
        // console.log( request.payload[ value ] );

    }
}
// Router Controller Object Export
module.exports = router_controller;