"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, TABLE, MESSAGE, CONSTANT } = require("../../../util/constant");

const query_scheme = Joi.object({
    oid: Joi.string().trim().min(1).max(128).required()
});

const get_by_oid = {
    method: "GET",
    path: API.CONTEXT + API.MASTER_CUSTOMER_GET_BY_OID,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "customer get by oid",
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
            message: MESSAGE.SUCCESS_GET_BY_OID,
            data: data
        };
    } catch (err) {
        log.error(err?.message);
    }
};

const get_data = async (request) => {
    let values = [CONSTANT.ACTIVE, CONSTANT.CUSTOMER, request.params.oid];
    let data = null;
    const query = `select c.oid, c.name, c.address, c.mobileNo as "mobile_no", c.mobileNo as "clone_mobile_no", c.email, c.initialBalance as "initial_balance",
    c.discountType as "discount_type", c.discountValue as "discount_value", c.imagePath as "image_path", customer_balance(c.oid) as balance,
    customer_draft_ticket_invoice_balance(c.oid) as "draft_ticket_invoice_amount", 
    customer_received_balance(c.oid) as "customer_received_amount", 
    customer_total_transaction_amount(c.oid) as "customer_total_transactionAmount", 
    (select coalesce(sum(amount), 0) from ${TABLE.PAYMENT} where 1 = 1 and status = $1
    and referenceType = $2 and referenceOid = c.oid) as paidAmount 
    from  ${TABLE.CUSTOMER}  c 
    where 1 = 1 and c.oid = $3`;
    let sql = {
        text: query,
        values: values
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql);
        data = data_set.length < 1 ? null : data_set[0];
    } catch (e) {
        log.error(`An exception occurred while getting data by oid: ${e?.message}`);
    }
    return data;
};

module.exports = get_by_oid;
