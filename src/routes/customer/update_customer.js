
/**
 * Title: Update Customer
 * Description: This endpoint is for handing the update customer request and update the particular row in the database customer table.
 * RequiredAuthentication: true
 * Authentication Strategy: jwt
 * File Path: src/routes/update_customer.js
 * Author: Md Bakibillah (Rohan)
 */

"use strict"

const log = require("../../util/log")
const Dao = require("../../util/dao")
const Helper = require("../../util/helper")
const { API, TABLE } = require("../../util/constant")
const Joi = require('@hapi/joi');
const uuid = require('uuid');


// Payload scheme of create customer
const payload_scheme = Joi.object({
    name: Joi.string().trim().min(3).max(30).required(),
    address: Joi.string().trim().min(5).max(70),
    mobile_no: Joi.string().trim().min(7).max(15),
    email: Joi.string().email(),
    initial_balance: Joi.number(),
    discount_type: Joi.string().trim().min(3).max(3),
    discount_value: Joi.number(),
    image_path: Joi.string(),
    status: Joi.string(),
})


// Route controller for Create Customer 
const route_controller = {
    method: "PUT",
    path: API.CONTEXT + API.UPDATE_CUSTOMER+"/{oid}",
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Update a customer",
        plugins: {
            hapiAuthorization: {
                validateEntityAcl: true,
                validateAclMethod: 'isGranted',
                aclQuery: async (id, request) => {
                    return {
                        isGranted: async (user, role) => { 
                            // return await Helper.is_granted(request, API.GET_USER_INFO)
                            return true;
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
        log.info(`Customer update failed`)
        return { status: true, code: 400, message: 'Customer update Failed' }
    }
    log.info(`Customer updated successfully`)
    return { status: true, code: 200, message: 'Customer data successfully updated' }
}

// Insert Customer data to databse 
const insert_data = async (request) => {
    const {name, address, mobile_no, email, initial_balance, discount_type, discount_value, image_path, status } = request.payload;

    let data = null; 

    // Customer update query 
    let sql = {
        text: `UPDATE ${TABLE.CUSTOMER}  name = $1, address = $2, mobileno = $3, email = $4, initialbalance = $5, discounttype = $6, discountvalue = $7,  imagepath = $8, status = $9 WHERE oid = $10`,
        values: [ name, address, mobile_no, email, initial_balance, null, discount_value, image_path, status, request.params.oid]
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
