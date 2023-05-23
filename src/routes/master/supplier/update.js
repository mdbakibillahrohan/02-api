"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const uuid = require('uuid');
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const payload_scheme = Joi.object({
    oid: Joi.string().trim().min(1).max(128).required(),

    customer_id: Joi.string().trim().min(1).max(128).optional(),
    name: Joi.string().trim().min(1).max(128).optional(),
    image_path: Joi.string().trim().min(1).max(256).optional(),
    mobile_no: Joi.string().trim().min(1).max(128).optional(),
    email: Joi.string().trim().email().optional(),
    
    status: Joi.string().trim().min(1).max(32).optional(),
    address: Joi.string().trim().min(1).max(128).optional(),
    initial_balance: Joi.number().optional(),
    commission_type: Joi.string().trim().min(1).max(128).optional(),
    commission_value: Joi.number().optional(),
    supplier_type: Joi.string().trim().min(1).max(128).optional(),
    service_charge: Joi.number().optional(),

    email_service: Joi.array().items({
            oid: Joi.string().trim().min(1).max(128).required(),
            service_type: Joi.string().trim().min(1).max(128).optional(),
            to_email_ddrees: Joi.string().trim().min(1).max(128).optional(),
            to_cc_email_addrees: Joi.string().trim().min(1).max(128).optional(),
            contact_no: Joi.string().trim().min(1).max(128).optional(),
            remarks: Joi.string().trim().optional(),
        }
    ).optional()
});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.MASTER_SUPPLIER_UPDATE_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "supplier update",
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
        let update = await update_data(request);
        
        if( update.updateDataRow < 1 || update.updateEmailServiceRow < 1){
            return { status: false, code: 400, message: MESSAGE.USER_NOT_EXIST };
        } else if( update.updateDataRow == 1 || update.updateEmailServiceRow == 1){
            log.info(`Successfully Update`);
            return { status: true, code: 200, message: MESSAGE.SUCCESS_UPDATE };
        }
        else{
            return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
        }
       
    } catch (err) {
        log.error(`An exception occurred while updating: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};
const update_data = async (request) => {
    try{
        const userInfo = await autheticatedUserInfo(request);

        let updateData = await update(userInfo, request)
        
        let updateEmailService = null
        if( request.payload["email_service"]){
            request.payload["email_service"].forEach(async email => {

             updateEmailService = await updateSupplierEmailService(userInfo, email, request)
                
            });
        }
        let output = {
            updateDataRow: updateData["rowCount"],

        }
        if( updateEmailService == null){
            return {
                updateDataRow: updateData["rowCount"],
                
            }
        }
        return {
            updateDataRow: updateData["rowCount"],
            updateEmailServiceRow: updateEmailService["rowCount"]
        }
        
    } catch ( err ){
        log.error(`${err?.message}`)
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
}
const update = async (userInfo, request) => {

    let cols = [];
    let data = [];
    let idx = 1;
    if(request.payload["name"]){
        cols.push(`name = $${idx++}`)
        data.push(request.payload["name"])
    }
    if(request.payload["image_path"]){
        cols.push(`image_path = $${idx++}`)
        data.push(request.payload["image_path"])
    }
    if(request.payload['customer_id']){
        cols.push(`customer_id = $${idx++}`)
        data.push(request.payload["customer_id"])
    }
    if(request.payload["mobile_no"]){
        cols.push(`mobile_no = $${idx++}`);
        data.push(request.payload["mobile_no"]);
        
    }
    if(request.payload["email"]){
        cols.push(`email = $${idx++}`);
        data.push(request.payload["email"]);
    }
    if(request.payload["address"]){
        cols.push(`address = $${idx++}`);
        data.push(request.payload["address"]);
    }
    if(request.payload["initial_balance"]){
        cols.push(`initial_balance = $${idx++}`);
        data.push(request.payload["initial_balance"]);
    }
    if(request.payload["commission_type"]){
        cols.push(`commission_type = $${idx++}`);
        data.push(request.payload["commission_type"]);
    }
    if(request.payload["commission_value"]){
        cols.push(`commission_value = $${idx++}`);
        data.push(request.payload["commission_value"]);
    }
    if(request.payload["supplier_type"]){
        cols.push(`supplier_type = $${idx++}`);
        data.push(request.payload["supplier_type"]);
    }
    if(request.payload["service_charge"] >= 0){
        cols.push(`service_charge = $${idx++}`);
        data.push(request.payload["service_charge"]);
    }

    if (request.payload['status'] == 'Submitted') {
        cols.push('submittedOn');
        params.push(`clock_timestamp()`)
    }
    let sCols = cols.join(', ')
    
    let query = `UPDATE ${ TABLE.SUPPLIER } set ${sCols} where 1 = 1 and oid = '${request.payload["oid"]}' and companyOid = '${userInfo.companyoid}'`;

    let sql = {
        text: query,
        values: data
    }
    try{
      return await Dao.execute_value(request.pg, sql);

    } catch(err) {
        log.error(`An exception occurred while updating supplier: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
    
};

const updateSupplierEmailService = async (userInfo, email, request) => {
    let cols = [];
    let data = [ ];

    let idx = 1;

    if( email["service_type"] ){
        cols.push(`service_type = $${idx++}` );
        data.push(email["service_type"]);
    }
    if( email["to_email_ddrees"] ){
        cols.push(`to_email_ddrees = $${idx++}` );
        data.push(email["to_email_ddrees"]);
    }
    if( email["to_cc_email_addrees"] ){
        cols.push(`to_cc_email_addrees = $${idx++}` );
        data.push(email["to_cc_email_addrees"]);
    }
    if( email["contact_no"] ){
        cols.push(`contact_no = $${idx++}` );
        data.push(email["contact_no"]);
    }
    if( email["remarks"] ){
        cols.push(`remarks = $${idx++}` );
        data.push(email["remarks"]);
    }

    let scols = cols.join(', ')

    let query = `update ${ TABLE.SUPPLIER_EMAIL_SERVICE } set (${scols}) where 1 = 1 and oid = ${email.oid} and supplieroid = '${request.payload[oid]}' and companyoid = '${userInfo.companyoid}'`;

    let sql = {
        text: query,
        values: data
    }
    try{
       return await Dao.execute_value(request.pg, sql);
    } catch(err) {
        log.error(`An exception occurred while updating supplierEmailService: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
    
}

module.exports = save_controller;
