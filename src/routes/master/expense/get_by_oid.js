"use strict"

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
// const { autheticatedUserInfo } = require("../../../util/helper");

const query_scheme = Joi.object({
    oid: Joi.string().trim().min(1).max(128).required(),
});

const route_controller = {
    method: "GET",
    path: API.CONTEXT + API.MASTER_EXPENSE_GET_BY_OID,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "get expense by oid",
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
        log.debug(`Request received - ${JSON.stringify(request.query)}`);
        const response = await handle_request(request);
        log.debug(`Response sent - ${JSON.stringify(response)}`);
        return h.response(response);
    },
};

const handle_request = async (request) => {
    try {
        const data = await get_expense_by_oid(request);
        const email_service_list = await getSupplierEmailServiceBySupplierOid(request)
        log.info(`data found by oid`);
        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_BY_OID,
            data,
            email_service_list
        };
    } catch (err) {
        log.error(err);
    }
}
const get_expense_by_oid = async (request) => {
    let data = null, query = null;
    query = `select s.oid, s.customerId as "customer_id", s.name, s.address, s.mobileNo as "mobile_no", s.email, s.imagePath as "image_path",
    s.initialBalance as "initial_balance", s.commissionType as "commission_type", s.commissionValue as "commission_value", s.serviceCharge as "service_charge",
    supplier_balance(s.oid) as balance, (select coalesce(sum(amount), 0) 
    from ${TABLE.PAYMENT} where 1 = 1 and status = $1
    and referenceType = $2 and referenceOid = s.oid) as "paid_amount"
    from ${TABLE.SUPPLIER} s
    where 1 = 1 and s.oid = $3`;
    let sql = {
        text: query,
        values: [CONSTANT.ACTIVE, CONSTANT.SUPPLIER,request.query.oid]
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql);
        data = data_set.length < 1 ? null : data_set[0];
    } catch (e) {
        log.error(`An exception occurred while getting data by oid: ${e}`);
    }
    return data;
}


const getSupplierEmailServiceBySupplierOid = async (request) => {
    let data = null;
    let query = `select ses.oid, ses.serviceType as "service_type", ses.toEmailAddrees as "to_email_addrees", ses.toCCEmailAddrees as "to_CC_email_addrees", 
    ses.contactNo as "contact_no", ses.remarks, ses.sortOrder as "sort_order", ses.supplierOid as "supplier_oid", ses.sortOrder as "sort_order"
    from ${TABLE.SUPPLIER_EMAIL_SERVICE} ses  
    where 1 = 1 and ses.supplierOid = $1 order by ses.sortOrder asc`;
    let sql = {
        text: query,
        values: [request.query.oid]
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql);
        data = data_set.length < 1 ? null : data_set[0];
    } catch (err) {
        log.error(`An exception occurred while getting data by oid: ${e}`);
    }
    return data;

}

module.exports = route_controller;