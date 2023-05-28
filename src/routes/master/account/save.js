"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");
const uuid = require("uuid");

const payload_scheme = Joi.object({
    name: Joi.string().trim().min(1).max(128).required(),
    account_number: Joi.string().trim().min(1).max(64).required(),
    account_type: Joi.string().valid("Cash", "Bank").trim().min(1).max(32).optional(),
    // status: Joi.string().valid("Active", "Inactive").trim().min(1).max(32).optional(),
    initial_balance: Joi.number().optional(),

});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.MASTER_ACCOUNT_SAVE_PATH,
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

    let cols = ["oid", "name", "accountNumber", "companyOid"];
    let params = ["$1", "$2", "$3", "$4"];

    let data = [uuid.v4(), request.payload["name"], request.payload["account_number"], userInfo.companyoid];

    let idx = 5;
    if (request.payload["account_type"]) {
        cols.push('accountType');
        params.push(`$${idx++}`)
        data.push(request.payload["account_type"])
    }
    if (request.payload["initial_balance"]) {
        cols.push('initialBalance');
        params.push(`$${idx++}`)
        data.push(request.payload["initial_balance"])
    }
    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.ACCOUNT} (${scols}) values (${sparams})`;
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
