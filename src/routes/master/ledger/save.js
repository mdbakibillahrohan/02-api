"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const uuid = require('uuid');
const { API, MESSAGE, CONSTANT, TABLE } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const payload_scheme = Joi.object({
    name: Joi.string().trim().min(1).max(128).required(),
    ledger_type: Joi.string().trim().min(1).max(32).required()
});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.MASTER_LEDGER_SAVE_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "save ledger",
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
        const save = await saveLedger(request);
        
        if (save["rowCount"] == 1){
            log.info(`Successfully saved`);
            return { status: true, code: 200, message: MESSAGE.SUCCESS_SAVE };
        }

    } catch (err) {
        log.error(`An exception occurred while deleting: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const saveLedger = async (request) => {
    const userInfo = await autheticatedUserInfo(request);
    let cols = ["oid", "name", "ledgerType", "companyOid"];
    let params = ['$1', '$2', '$3', '$4'];
    let data = [uuid.v4(), request.payload["name"], request.payload["ledger_type"], userInfo.companyoid ];
    
    if (request.payload['status'] == 'Submitted') {
        cols.push('submittedOn');
        params.push(`clock_timestamp()`)
    }
    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.LEDGER} (${scols}) values (${sparams})`;
    
    let sql = {
        text: query,
        values: data
    }
    try{
        return await Dao.execute_value(request.pg, sql)
    } 
    catch(err) {
        log.error(`An exception occurred while deleting: ${err?.message}`)
    }
};


module.exports = save_controller;
