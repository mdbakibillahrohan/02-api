"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE } = require("../../../util/constant");

const payload_scheme = Joi.object({
    status: Joi.string().trim().min(1).max(32).required(),
    oid: Joi.string().trim().min(1).max(128).required()
});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.PAYMENT_MADE_SAVE_PATH,
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
        await save_data(request);
        log.info(`Successfully saved`);
        return { status: true, code: 200, message: MESSAGE.SUCCESS_SAVE };
    } catch (err) {
        log.error(`An exception occurred while saving: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const savePaymentReceived = async (userInfo, payment) => {
    let cols = ["oid", "paymentNo", "paymentDate", "amount", "imagePath", 
        "status", "paymentType", "referenceType", "referenceOid", "paymentNature", 
        "accountOid", "createdBy", "createdOn", "companyOid"];

    let params = ['$1', '$2', '$3', '$4', '$5', '$6', '$7', '$8', '$9', '$10', '$11', '$12', '$13', '$14'];
    let data = [payment["oid"], payment["payment_no"], payment["payment_date"], payment["amount"], payment["image_path"], payment["status"], payment["payment_type"], payment["reference_type"], payment["reference_oid"], payment["payment_nature"], payment["account_oid"], userInfo["loginid"], 'clock_timestamp()', userInfo.companyoid ];
    let idx = 15;

    if(payment["payment_mode"]) {
        cols.push("payment_mode");
        params.push(`$${idx++}`);
        data.push(payment["payment_mode"]);
    }
    if(payment["check_no"]) {
        cols.push("check_no");
        params.push(`$${idx++}`);
        data.push(payment["check_no"]);
    }
    if(payment["description"]) {
        cols.push("description");
        params.push(`$${idx++}`);
        data.push(payment["description"]);
    }

    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.PAYMENT} (${scols}) values (${sparams})`;
    let sql = {
        text: query,
        values: data
    }
    try{
        
        return await Dao.execute_value(sql)
    } 
    catch (err) {
        log.error(`An exception occurred while saving paymentReceive: ${err?.message}`)
    }
}

const saveInvoiceBillPayment = async (userInfo, invoice) => {
    let cols = ["oid", "refInvoiceType", "refInvoiceOid", "amount", "remarks", 
    "status", "paymentOid", "companyOid"];

    let params = ['$1', '$2', '$3', '$4', '$5', '$6', '$7', '$8'];

    let data = [invoice["oid"], invoice["ref_invoice_type"], invoice["ref_invoice_oid"], invoice["amount"], invoice["remarks"], invoice["status"], invoice["payment_oid"], userInfo.companyoid ];


    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.PAYMENT} (${scols}) values (${sparams})`;
    let sql = {
        text: query,
        values: data
    }
    try{
        
        return await Dao.execute_value(sql)
    } 
    catch (err) {
        log.error(`An exception occurred while saving paymentReceive: ${err?.message}`)
    }
}

const save_data = async (request) => {
    let cols = ['oid', 'createdBy'];
    let params = ['$1', '$2'];
    let data = ['1', request.auth.credentials.userId];
    let idx = 3;
    if (request.payload['status'] == 'Submitted') {
        cols.push('submittedOn');
        params.push(`clock_timestamp()`)
    }
    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into table_name (${scols}) values (${sparams})`;
    let sql = {
        text: query,
        values: data
    }
    await Dao.execute_value(sql)
};


module.exports = save_controller;
