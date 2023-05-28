"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");
const uuid = require("uuid");

const payload_scheme = Joi.object({
    oid: Joi.string().trim().min(1).max(128).required(),
    status: Joi.string().trim().valid('Active', 'Inactive', 'Draft').min(1).max(32).required(),
    account_oid: Joi.string().trim().min(1).max(128).required(),
    transaction_date: Joi.date().required(),
    amount: Joi.number().required(),
    transaction_type: Joi.string().trim().valid('Debit', 'Credit').min(1).max(32).required(),
    description: Joi.string().trim().min(1).optional(),
});

const update_controller = {
    method: "POST",
    path: API.CONTEXT + API.MASTER_TRANSACTION_UPDATE_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "update",
        plugins: { hapiAuthorization: false },
        validate: {
            payload: payload_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h
                    .response({ code: 400, status: false, message: err?.message })
                    .takeover();
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

    let cols = ["status = $1", "accountoid = $2", "transactionDate = $3", 
    "amount = $4", "transactionType = $5", "editedBy = $6", "editedOn = $7"];

    let data = [request.payload["status"], request.payload["account_oid"], request.payload["transaction_date"], request.payload["amount"], request.payload["transaction_type"], userInfo.loginid, 'now()'];

    let idx = 8;
    if (request.payload["description"]) {
        cols.push(`description = $${idx++}`)
        data.push(request.payload["description"])
    }
    let scols = cols.join(', ')

    let query = `update ${ TABLE.ACCOUNT_TRANSACTION } set ${scols} where 1 = 1 and oid = $${idx++}`;
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

module.exports = update_controller;
