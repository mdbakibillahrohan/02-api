
/**
 * Title: Save Vendor
 * Description: This endpoint is for handing the save Vendor request and create a Vendor row in database table
 * RequiredAuthentication: true
 * Authentication Strategy: jwt
 * File Path: src/routes/save_vendor.js
 * Author: Md. Nazim Uddin Hamza
 */

"use strict"

const log = require("../../util/log")
const Dao = require("../../util/dao")
const Helper = require("../../util/helper")
const { API, TABLE } = require("../../util/constant")
const Joi = require('@hapi/joi');
const uuid = require('uuid');


// Payload scheme of create Vendor
const payload_scheme = Joi.object({
    name: Joi.string().trim().min(3).max(30).required(),
    address: Joi.string().trim().min(5).max(70),
    mobile_no: Joi.string().trim().min(7).max(15),
    email: Joi.string().email(),
    registered_id: Joi.number(),
    discount_type: Joi.string().trim().min(3).max(3),
    discount_value: Joi.number(),
    image_path: Joi.string(),
    status: Joi.string(),
})


// Route controller for Create Vendor 
const route_controller = {
    method: "POST",
    path: API.CONTEXT + API.SAVE_VENDOR,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Create a Vendor",
        plugins: {
            hapiAuthorization: {
                validateEntityAcl: true,
                validateAclMethod: 'isGranted',
                aclQuery: async (id, request) => {
                    return {
                        isGranted: async (user, role) => { 
                            return await Helper.is_granted(request, API.GET_USER_INFO)
                            // return true;
                        }
                    }
                }
            },
            
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
        log.debug(`Request received - ${JSON.stringify(request.payload)}`)
        const response = await handle_request(request)
        log.debug(`Response sent - ${JSON.stringify(response)}`)
        return h.response(response);
    }
}

// Handling the request 
const handle_request = async (request) => {
    let data = await insert_data(request)
    if (!data) {
        log.info(`Vendor insertion failed`)
        return { status: true, code: 400, message: 'Vendor Insertion Failed' }
    }
    log.info(`User data found`)
    return { status: true, code: 201, message: 'Vendor data successfully inserted' }
}

// Insert Vendor data to databse 
const insert_data = async (request) => {
    const {name, address, mobile_no, email, initial_balance, discount_type, discount_value, image_path, status } = request.payload;

    let data = null;
    const id = "client-"+Date.now();
    // const id = uuid.v4();
    const userInfo = await Helper.autheticatedUserInfo(request);
    const currentTime = new Date().toISOString();
    let sql = {
        text: `INSERT INTO ${TABLE.Vendor}(oid, name, address, mobileno, email, initialbalance, discounttype, discountvalue,  imagepath, status, createdby, createdon, companyoid) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13 )`,
        values: [id, name, address, mobile_no, email, initial_balance, null, discount_value, image_path, status, userInfo.oid, currentTime, userInfo.companyoid]
    }
    try {
        let data_set = await Dao.execute_value(request.pg, sql)
        if (data_set.rowCount == 1) {
            data = true;
        }
    } catch (e) {
        log.error(`An exception occurred while getting user data: ${e?.message}`)
    }
    return data;
    
}

// exporting the modules for using in another file 
module.exports = route_controller
