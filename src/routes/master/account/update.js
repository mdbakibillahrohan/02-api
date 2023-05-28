"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");
const uuid = require("uuid");

const payload_scheme = Joi.object({
    oid: Joi.string().trim().min(1).max(128).required(),
    name: Joi.string().trim().min(1).max(128).required(),
    account_number: Joi.string().trim().min(1).max(64).required(),
    account_type: Joi.string().valid("Cash", "Bank").trim().min(1).max(32).optional(),
    // status: Joi.string().valid("Active", "Inactive").trim().min(1).max(32).optional(),
    initial_balance: Joi.number().optional(),

});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.MASTER_ACCOUNT_UPDATE_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "save",
        plugins: { hapiAuthorization: false },
        validate: {
            payload: payload_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 301, status: false, message: err?.message }).takeover();
            },
        },
    },
    handler: async (request, h) => {
        log.info(`Request received - ${JSON.stringify(request.payload)}`);
        const response = await handle_request(request);
        log.debug(`Response sent - ${JSON.stringify(response)}`);
        return h.response(response);
    },
};

const handle_request = async (request) => {
    try {
            
        const update = await update_data(request);
        
        if( update["rowCount"] == 1)
        {
            log.info(MESSAGE.SUCCESS_UPDATE );
            return { 
                status: true, 
                code: 200, 
                message: MESSAGE.SUCCESS_UPDATE 
            };            
        }

        else if( update["rowCount"] == 0 ) {
            log.info(MESSAGE.ALREADY_UPDATE);
            return {
                    status: true, 
                    code: 202, 
                    message: MESSAGE.ALREADY_UPDATE 
                };            
        } 

        else{
            log.info(MESSAGE.USER_NOT_EXIST)
            return {
                status: true,
                code: 204,
                message: MESSAGE.USER_NOT_EXIST+ `or some other issue check oid`
            }
        }
        
    } catch (err) {
        log.error(`An exception occurred while updating: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};


const update_data = async (request) => {
    const userInfo = await autheticatedUserInfo(request);

    let cols = ["name = $1", "accountNumber = $2"];

    let data = [request.payload["name"], request.payload["account_number"]];

    let idx = 3;
    if (request.payload["account_type"]) {
        cols.push(`accountType = $${idx++}`)
        data.push(request.payload["account_type"])
    }
    if (request.payload["initial_balance"]) {
        cols.push(`initialBalance = $${idx++}`)
        data.push(request.payload["initial_balance"])
    }
    let scols = cols.join(', ')

    let query = `update ${ TABLE.ACCOUNT } set ${scols} where 1 = 1 and oid = $${idx++}`;
    data.push(request.payload["oid"])

    let sql = {
        text: query,
        values: data
    }
    try{
        return await Dao.execute_value(request.pg, sql)
        
    } 
    catch (err) {
        log.error(`An exception occurred while saving paymentReceive: ${err?.message}`)
    }
};


module.exports = save_controller;
