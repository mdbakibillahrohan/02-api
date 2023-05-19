"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const uuid = require('uuid');
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const payload_scheme = Joi.object({
    customerId: Joi.string().trim().min(1).max(128).required(),
    name: Joi.string().trim().min(1).max(128).required(),
    imagePath: Joi.string().trim().min(1).max(256).required(),
    mobileNo: Joi.string().trim().min(1).max(128).required(),
    email: Joi.string().trim().email().required(),
    
    status: Joi.string().trim().min(1).max(32).optional(),
    address: Joi.string().trim().min(1).max(128).optional(),
    initialBalance: Joi.number().optional(),
    commissionType: Joi.string().trim().min(1).max(128).optional(),
    commissionValue: Joi.number().optional(),
    supplierType: Joi.string().trim().min(1).max(128).optional(),
    serviceCharge: Joi.number().optional(),

    emailService: Joi.array().items({
            serviceType: Joi.string().trim().min(1).max(128).optional(),
            toEmailAddrees: Joi.string().trim().min(1).max(128).optional(),
            toCCEmailAddrees: Joi.string().trim().min(1).max(128).optional(),
            contactNo: Joi.string().trim().min(1).max(128).optional(),
            remarks: Joi.string().trim().optional(),
        }
    )
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
        let save = await save_data(request);
        log.info(`Successfully saved`);
        return { status: true, code: 200, message: MESSAGE.SUCCESS_SAVE };
    } catch (err) {
        log.error(`An exception occurred while saving: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};
const save_data = async (request) => {
    try{
        const userInfo = await autheticatedUserInfo(request);
        const supplierOid = uuid.v4();

        let save_data = await save(userInfo, supplierOid, request)
        let sortOrder = 1;
        let emailService;
        request.payload["emailService"].forEach(async email => {
            let oid = uuid.v4()
            email.oid = oid
            email.supplierOid = supplierOid
            email.sortOrder = sortOrder ++ 
            emailService = await saveSupplierEmailService(userInfo, email, request)
            
        });
    } catch ( err ){
        log.error(`${err?.message}`)
    }
}
const save = async (userInfo, oid, request) => {

    let cols = ["oid", "customerId", "name", "imagePath", "companyOid"];
    let params = ['$1', '$2', '$3', '$4', '$5'];
    let data = [ oid, request.payload["customerId"], request.payload["name"], request.payload["imagePath"], userInfo.companyoid];
    let idx = 6;
    if(request.payload["mobileNo"]){
        cols.push("mobileNo");
        params.push(`$${idx++}`);
        data.push(request.payload["mobileNo"]);

    }
    if(request.payload["email"]){
        cols.push("email");
        params.push(`$${idx++}`);
        data.push(request.payload["email"]);
    }
    if(request.payload["address"]){
        cols.push("address");
        params.push(`$${idx++}`);
        data.push(request.payload["address"]);
    }
    if(request.payload["initialBalance"]){
        cols.push("initialBalance");
        params.push(`$${idx++}`);
        data.push(request.payload["initialBalance"]);
    }
    if(request.payload["commissionType"]){
        cols.push("commissionType");
        params.push(`$${idx++}`);
        data.push(request.payload["commissionType"]);
    }
    if(request.payload["commissionValue"]){
        cols.push("commissionValue");
        params.push(`$${idx++}`);
        data.push(request.payload["commissionValue"]);
    }
    if(request.payload["supplierType"]){
        cols.push("supplierType");
        params.push(`$${idx++}`);
        data.push(request.payload["supplierType"]);
    }
    if(request.payload["serviceCharge"] >= 0){
        cols.push("serviceCharge");
        params.push(`$${idx++}`);
        data.push(request.payload["serviceCharge"]);
    }

    if (request.payload['status'] == 'Submitted') {
        cols.push('submittedOn');
        params.push(`clock_timestamp()`)
    }
    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${ TABLE.SUPPLIER } (${scols}) values (${sparams})`;
    let sql = {
        text: query,
        values: data
    }
    let execute;
    try{
       execute =  await Dao.execute_value(request.pg, sql);

    } catch(err) {
        log.error(`saveSupplier Error: ${err?.message}`)
    }
    return execute
};

const saveSupplierEmailService = async (userInfo, email, request) => {
    let cols = ["oid", "serviceType", "toEmailAddrees", "supplierOid", "sortOrder", "companyOid"];
    let params = ['$1', '$2', '$3', '$4', '$5', '$6'];
    let data = [ email.oid, email['serviceType'], email["toEmailAddrees"], email["supplierOid"], email["sortOrder"], userInfo.companyoid];

    let idx = 7;

    if( email["toCCEmailAddrees"] ){
        cols.push("toCCEmailAddrees");
        params.push( `$${idx++}` );
        data.push(email["toCCEmailAddrees"]);
    }
    if( email["contactNo"] ){
        cols.push("contactNo");
        params.push( `$${idx++}` );
        data.push(email["contactNo"]);
    }
    if( email["remarks"] ){
        cols.push("remarks");
        params.push( `$${idx++}` );
        data.push(email["remarks"]);
    }

    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${ TABLE.SUPPLIER_EMAIL_SERVICE } (${scols}) values (${sparams})`;
    let sql = {
        text: query,
        values: data
    }
    let execute;
    try{
       execute =  await Dao.execute_value(request.pg, sql);
    } catch(err) {
        log.error(`saveSupplierEmailService error: ${err?.message}`)
    }
    return execute
}
module.exports = save_controller;
