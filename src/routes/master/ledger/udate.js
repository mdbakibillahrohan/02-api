"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const uuid = require('uuid');
const { API, MESSAGE, CONSTANT, TABLE } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const payload_scheme = Joi.object({
    oid: Joi.string().trim().min(1).max(128).required(),
    name: Joi.string().trim().min(1).max(128).required(),
    ledger_type: Joi.string().trim().min(1).max(32).required()
});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.MASTER_LEDGER_UPDATE_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "update ledger",
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
        const userInfo = await autheticatedUserInfo(request);

        if( request.payload.ledger_type == CONSTANT.EXPENSE ) {
            request.payload.payment_type = "Debit";
        } else  {
            request.payload.payment_type = "Credit";
        }
        const update = await updateLedger(userInfo, request);
        const update_payment = await updatePayment(userInfo, request)

        if (update["rowCount"] == 1 || update_payment["rowCount"] == 1){
            log.info(`Successfully update`);
            return { status: true, code: 200, message: MESSAGE.SUCCESS_UPDATE };
        } 
        else if (update["rowCount"] == 0 && update_payment["rowCount"] == 0){
            log.info(ALREADY_UPDATE);
            return { status: true, code: 202, message: MESSAGE.ALREADY_UPDATE};
        }

        else {
            log.error(`An exception occurred while updating: ${err?.message}`);
            return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
        }


    } catch (err) {
        log.error(`An exception occurred while updating: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const updateLedger = async (userInfo, request) => {

    let cols = [ "name = $1", "ledgerType = $2"];

    let data = [request.payload["name"], request.payload["ledger_type"], request.payload['oid'], userInfo.companyoid ];
    

    let scols = cols.join(', ')

    let query = `update ${ TABLE.LEDGER } set ${scols} where 1 = 1 and oid = $3 and companyoid = $4`;
    
    let sql = {
        text: query,
        values: data
    }
    try{
        return await Dao.execute_value(request.pg, sql)
    } 
    catch(err) {
        log.error(`An exception occurred while updating: ${err?.message}`)
    }
};

const updatePayment = async (userInfo, request) => {

    let cols = [ "paymentType = $1", "referenceType = $2"];

    let data = [request.payload["payment_type"], request.payload.ledger_type, request.payload['oid']];
    
    

    let scols = cols.join(', ')

    let query = `update ${ TABLE.PAYMENT } set ${scols} where 1 = 1 and referenceOid = $3 `;
    
    let sql = {
        text: query,
        values: data
    }
    try{
        return await Dao.execute_value(request.pg, sql)
    } 
    catch(err) {
        log.error(`An exception occurred while payment updating: ${err?.message}`)
    }
}


module.exports = save_controller;
