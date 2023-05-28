"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, TABLE, MESSAGE } = require("../../../util/constant");

const query_scheme = Joi.object({
    customer_oid: Joi.string().trim().min(1).max(128).required(),
});

const get_by_oid = {
    method: "GET",
    path: API.CONTEXT + API.PAYMENT_RECEIVED_GET_CREDIT_NOTE_BALANCE,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Payment receive get credit note balance",
        plugins: { hapiAuthorization: false },
        validate: {
            query: query_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 301, status: false, message: err }).takeover();
            },
        },
    },
    handler: async (request, h) => {
        log.info(`Request received - ${JSON.stringify(request.query)}`);
        const response = await handle_request(request);
        log.info(`Response sent - ${JSON.stringify(response)}`);
        return h.response(response);
    },
};

const handle_request = async (request) => {
    try {
        let data = await get_data(request);
        if (!data || data.length != 1) {
            return {
                status: true,
                code: 200,
                message: MESSAGE.NO_DATA_FOUND,
                data: data
            };
        }
        log.info(`Payment receive get credit note balance data found`);
        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_BY_OID,
            data: data
        };
    } catch (err) {
        log.error(err);
    }
};

const get_data = async (request) => {
    let data = null, query = null;
    query = `select customer_creditnote_balance($1) as creditNoteBalance`;
    let sql = {
        text: query,
        values: [request.query.customer_oid]
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql);
        data = data_set.length < 1 ? null : data_set[0];
    } catch (e) {
        log.error(`An exception occurred while getting Payment receive get credit note balance data: ${e}`);
    }
    return data;
};

module.exports = get_by_oid;
