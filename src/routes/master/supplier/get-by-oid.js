"use strict"

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const query_scheme = Joi.object({
    oid: Joi.string().trim().min(1).max(128).required()
});

const route_controller = {
    method: "GET",
    path: API.CONTEXT + API.MASTER_GET_SUPPLIER_BY_OID_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "get supplier by oid",
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
}
const get_data = async (request) => {
    const userInfo = await autheticatedUserInfo(request);
    let list_data = [];
    let data = [];
 
    let query = `select s.oid, s.customerId as "customer_id", s.name, s.address, s.mobileNo as "mobile_no", s.email, s.imagePath as "image_path", s.status, s.initialBalance as "initial_balance", s.commissionType as "commission_type", s.commissionValue as "commission_value", s.serviceCharge as "service_charge", s.supplierType as "supplier_type", supplier_total_transaction_amount(s.oid) as supplier_total_transaction_amount, supplier_balance(s.oid) as balance, (select coalesce(sum(amount), 0)  from ${ TABLE.PAYMENT } where 1 = 1 and status = $1 and referenceType = $2 and referenceOid = s.oid) as "paid_amount" from ${TABLE.SUPPLIER} as s where 1 = 1 and oid = $3`;
    
    data.push(request.query["status"],"Supplier", request.query["oid"])
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