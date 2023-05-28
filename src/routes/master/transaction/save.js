"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");
const uuid = require("uuid");

const payload_scheme = Joi.object({
    status: Joi.string().trim().valid('Active', 'Inactive', 'Draft').min(1).max(32).required(),
    account_oid: Joi.string().trim().min(1).max(128).required(),
    transaction_date: Joi.date().required(),
    amount: Joi.number().required(),
    transaction_type: Joi.string().trim().valid('Debit', 'Credit').min(1).max(32).required(),
    description: Joi.string().trim().min(1).optional(),
});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.MASTER_TRANSACTION_SAVE_PATH,
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
        const save = await save_data(request);

        if(save["rowCount"] == 1){
            log.info(`Successfully saved`);
            return { status: true, code: 200, message: MESSAGE.SUCCESS_SAVE };         
        }
        log.info(MESSAGE.INTERNAL_SERVER_ERROR);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    } catch (err) {
        log.error(`An exception occurred while saving: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const save_data = async (request) => {
    const userInfo = await autheticatedUserInfo(request);

    const transactionId = `${new Date().toISOString().slice(0,10).replace(/-/g, '')}`+`${new Date().toISOString().slice(11,19).replace(/:/g, '')}`;

    let cols = ["oid", "status", "accountoid", "transactionNo", "transactionDate", "amount", 
        "transactionType", "createdBy", "createdOn", "companyOid"];
    let params = ["$1", "$2", "$3", "$4", "$5", "$6", "$7", "$8", "$9", "$10"];

    let data = [uuid.v4(), request.payload["status"], request.payload["account_oid"], transactionId, request.payload["transaction_date"], request.payload["amount"], request.payload["transaction_type"], userInfo.loginid, 'now()', userInfo.companyoid];

    let idx = 11;
    if (request.payload["description"]) {
        cols.push('description');
        params.push(`$${idx++}`)
        data.push(request.payload["description"])
    }
    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.ACCOUNT_TRANSACTION} (${scols}) values (${sparams})`;
    let sql = {
        text: query,
        values: data
    }
    try{
        return await Dao.execute_value(request.pg, sql)
        
    } 
    catch (err) {
        log.error(`An exception occurred while saving : ${err?.message}`)
    }
};


module.exports = save_controller;
