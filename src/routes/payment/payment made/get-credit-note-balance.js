"use strict"

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const query_scheme = Joi.object({
    supplier_oid: Joi.string().trim().min(1).max(128).required()
});

const route_controller = {
    method: "GET",
    path: API.CONTEXT + API.PAYMENT_MADE_GET_CREDIT_NOTE_BALANCE_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "get credit note balance",
        plugins: { hapiAuthorization: false },
        validate: {
            query: query_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 301, status: false, message: err?.message }).takeover();
            },
        },
    },
    handler: async (request, h) => {
        log.debug(`Request received - ${JSON.stringify(request.query)}`);
        const response = await handle_request(request);
        log.debug(`Response sent - ${JSON.stringify(response)}`);
        return h.response(response);
    },
};

const handle_request = async (request) => {
    try {
        let data = await get_data(request);
        
        log.info(`data found by oid`);
        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_LIST,
            data: data
        };
    } catch (err) {
        log.error(err?.message);
    }
}
const get_data = async (request) => {
    const userInfo = await autheticatedUserInfo(request);
    let list_data = [];
    let data = [];
 
    let query = `select supplier_creditnote_balance($1) as credit_note_balance`;
    
    data.push(request.query["supplier_oid"])
    let idx = 4;
    query += ` and companyoid = $${idx++}`;
    data.push(userInfo.companyoid); 
    let sql = {
        text: query,
        values: data
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql);
        list_data = data_set.length < 1 ? null : data_set[0];
    } catch (e) {
        log.error(`An exception occurred while getting data by oid: ${e?.message}`);
    }
    return list_data;
}
module.exports = route_controller;