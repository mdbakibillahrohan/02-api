"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const uuid = require('uuid');
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const payload_scheme = Joi.object({
    customer_id: Joi.string().trim().min(1).max(128).required(),
    name: Joi.string().trim().min(1).max(128).required(),
    image_path: Joi.string().trim().min(1).max(256).required(),
    mobile_no: Joi.string().trim().min(1).max(128).required(),
    email: Joi.string().trim().email().required(),

    status: Joi.string().trim().min(1).max(32).optional(),
    address: Joi.string().trim().min(1).max(128).optional(),
    initial_balance: Joi.number().optional(),
    commission_type: Joi.string().trim().min(1).max(128).optional(),
    commission_value: Joi.number().optional(),
    supplier_type: Joi.string().trim().min(1).max(128).optional(),
    service_charge: Joi.number().optional(),

    email_service: Joi.array().items({
            service_type: Joi.string().trim().min(1).max(128).optional(),
            to_email_addrees: Joi.string().trim().min(1).max(128).optional(),
            to_cc_email_addrees: Joi.string().trim().min(1).max(128).optional(),
            contact_no: Joi.string().trim().min(1).max(128).optional(),
            remarks: Joi.string().trim().optional(),
        }
    ).optional()
});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.MASTER_SUPPLIER_SAVE_PATH,
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
                return h.response({ code: 301, status: false, message: err }).takeover();
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
        let save = await save_data(request);
        log.info(`Successfully saved`);
        return { status: true, code: 200, message: MESSAGE.SUCCESS_SAVE };
    } catch (err) {
        log.error(`An exception occurred while saving: ${err}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};
const save_data = async (request) => {
    try {
        const userInfo = await autheticatedUserInfo(request);
        const supplierOid = uuid.v4();

        let save_data = await save(userInfo, supplierOid, request)
        let sortOrder = 1;
        let email_service;
        request.payload["email_service"].forEach(async email => {
            let oid = uuid.v4()
            email.oid = oid
            email.supplierOid = supplierOid
            email.sortOrder = sortOrder ++ 
            await saveSupplierEmailService(userInfo, email, request)
            
        });
    } catch (err) {
        log.error(`${err}`)
    }
}
const save = async (userInfo, oid, request) => {

    let cols = ["oid", "customer_id", "name", "image_path", "companyOid"];
    let params = ['$1', '$2', '$3', '$4', '$5'];
    let data = [ oid, request.payload["customer_id"], request.payload["name"], request.payload["image_path"], userInfo.companyoid];
    let idx = 6;
    if(request.payload["mobile_no"]){
        cols.push("mobile_no");
        params.push(`$${idx++}`);
        data.push(request.payload["mobile_no"]);

    }
    if (request.payload["email"]) {
        cols.push("email");
        params.push(`$${idx++}`);
        data.push(request.payload["email"]);
    }
    if (request.payload["address"]) {
        cols.push("address");
        params.push(`$${idx++}`);
        data.push(request.payload["address"]);
    }
    if(request.payload["initial_balance"]){
        cols.push("initial_balance");
        params.push(`$${idx++}`);
        data.push(request.payload["initial_balance"]);
    }
    if(request.payload["commission_type"]){
        cols.push("commission_type");
        params.push(`$${idx++}`);
        data.push(request.payload["commission_type"]);
    }
    if(request.payload["commission_value"]){
        cols.push("commission_value");
        params.push(`$${idx++}`);
        data.push(request.payload["commission_value"]);
    }
    if(request.payload["supplier_type"]){
        cols.push("supplier_type");
        params.push(`$${idx++}`);
        data.push(request.payload["supplier_type"]);
    }
    if(request.payload["service_charge"] >= 0){
        cols.push("service_charge");
        params.push(`$${idx++}`);
        data.push(request.payload["service_charge"]);
    }

    if (request.payload['status'] == 'Submitted') {
        cols.push('submittedOn');
        params.push(`clock_timestamp()`)
    }
    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.SUPPLIER} (${scols}) values (${sparams})`;
    let sql = {
        text: query,
        values: data
    }
    let execute;
    try {
        execute = await Dao.execute_value(request.pg, sql);

    } catch (err) {
        log.error(`saveSupplier Error: ${err}`)
    }
    return execute
};

const saveSupplierEmailService = async (userInfo, email, request) => {
    let cols = ["oid", "service_type", "to_email_addrees", "supplierOid", "sortOrder", "companyOid"];
    let params = ['$1', '$2', '$3', '$4', '$5', '$6'];
    let data = [ email.oid, email['service_type'], email["to_email_addrees"], email["supplierOid"], email["sortOrder"], userInfo.companyoid];

    let idx = 7;

    if( email["to_cc_email_addrees"] ){
        cols.push("to_cc_email_addrees");
        params.push( `$${idx++}` );
        data.push(email["to_cc_email_addrees"]);
    }
    if( email["contact_no"] ){
        cols.push("contact_no");
        params.push( `$${idx++}` );
        data.push(email["contact_no"]);
    }
    if (email["remarks"]) {
        cols.push("remarks");
        params.push(`$${idx++}`);
        data.push(email["remarks"]);
    }

    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.SUPPLIER_EMAIL_SERVICE} (${scols}) values (${sparams})`;
    let sql = {
        text: query,
        values: data
    }
    let execute;
    try {
        execute = await Dao.execute_value(request.pg, sql);
    } catch (err) {
        log.error(`saveSupplierEmailService error: ${err}`)
    }
    return execute
}
module.exports = save_controller;
