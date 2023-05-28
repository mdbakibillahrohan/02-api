"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");
const uuid = require("uuid");


const payload_scheme = Joi.object({
    payment_date: Joi.date().required(),
    amount: Joi.number().required(),
    image_path:  Joi.string().trim().min(1).max(256).required(),
    status:  Joi.string().valid('Active','Inactive', 'Draft').required(),
    reference_type: Joi.string().valid('Customer', 'Supplier', 'Expense').required(),
    reference_oid: Joi.string().trim().min(1).max(128).required(),
    // payment_type: Joi.string().valid('Debit', 'Credit').required(),
    payment_nature: Joi.string().valid('CreditNote','Withdraw', 'CashWithdraw', 'CreditNoteAdjustment', 'CashAdjustment', 'VendorCredit').optional(),
    account_oid: Joi.string().trim().min(1).max(128).required(),
    check_no:  Joi.string().trim().min(1).max(128).optional(),
    description:  Joi.string().trim().min(1).max(128).optional(),
    account_holder_name:  Joi.string().trim().min(1).max(128).optional(),
    bank_account_no:  Joi.string().trim().min(1).max(128).optional(),
    bank_name:  Joi.string().trim().min(1).max(128).optional(),
    branch_name:  Joi.string().trim().min(1).max(128).optional(),
    payment_mode: Joi.string().valid('Cheque','BankDeposit', 'Cash', 'CreditCard', 'CreditNote').optional(),
    reference_by:  Joi.string().trim().min(1).max(128).optional(),
    reference_by_mobile_no:  Joi.string().trim().min(1).max(128).optional(),
    received_by:  Joi.string().trim().min(1).max(128).optional(),
    cheque_issue_date:  Joi.string().trim().min(1).max(128).optional(),

});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.MASTER_PAYMENT_SAVE_PATH,
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
        request.payload.payment_type = request.payload.reference_type == CONSTANT.SUPPLIER || request.payload.reference_type == CONSTANT.EXPENSE ? 'Debit' : 'Credit';
        request.payload.payment_no =  `${new Date().toISOString().slice(0,10).replace(/-/g, '')}`+`${new Date().toISOString().slice(11,19).replace(/:/g, '')}`;

        const userInfo = await autheticatedUserInfo(request);
        request.payload.vendor_name = await getVendorNameList(userInfo, request);
    
        const save = await save_data(userInfo, request);

        if(save["rowCount"] == 1){
            log.info(`Successfully saved`);
            return { status: true, code: 200, message: MESSAGE.SUCCESS_SAVE };         
        }
        log.info(MESSAGE.INTERNAL_SERVER_ERROR);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };

    } catch (err) {
        log.error(`An exception occurred while saving: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const save_data = async (userInfo, request) => {
    let cols = ["oid", "paymentNo", "paymentDate", "amount", "imagePath", 
     "status", "paymentType", "referenceType", "referenceOid", "paymentNature",
     "accountOid", "createdBy", "createdOn", "companyOid"];
    let params = ['$1', '$2', '$3', '$4', '$5', '$6', '$7', '$8', '$9', '$10', '$11', '$12', '$13', '$14'];

    let data = [uuid.v4(), request.payload["payment_no"], request.payload["payment_date"], request.payload["amount"], request.payload["image_path"], request.payload["status"], request.payload["payment_type"], request.payload["reference_type"], request.payload["reference_oid"], request.payload["payment_nature"], request.payload["account_oid"], userInfo.loginid, 'now()', userInfo.companyoid ];
    let idx = 15;


    if(request.payload["check_no"]) {
        cols.push("checkNo");
        params.push(`$${idx++}`);
        data.push(request.payload["check_no"]);
    }
    if(request.payload["description"]) {
        cols.push("description");
        params.push(`$${idx++}`);
        data.push(request.payload["description"]);
    }
    if(request.payload["account_holder_name"]) {
        cols.push("accountHolderName");
        params.push(`$${idx++}`);
        data.push(request.payload["account_holder_name"]);
    }

    if(request.payload["bank_account_no"]) {
        cols.push("bankAccountNo");
        params.push(`$${idx++}`);
        data.push(request.payload["bank_account_no"]);
    }
    if(request.payload["bank_name"]) {
        cols.push("bankName");
        params.push(`$${idx++}`);
        data.push(request.payload["bank_name"]);
    }
    if(request.payload["branch_name"]) {
        cols.push("branchName");
        params.push(`$${idx++}`);
        data.push(request.payload["branch_name"]);
    }
    if(request.payload["payment_mode"]) {
        cols.push("paymentMode");
        params.push(`$${idx++}`);
        data.push(request.payload["payment_mode"]);
    }
    if(request.payload["reference_by"]) {
        cols.push("referenceBy");
        params.push(`$${idx++}`);
        data.push(request.payload["reference_by"]);
    }
    if(request.payload["reference_by_mobile_no"]) {
        cols.push("referenceByMobileNo");
        params.push(`$${idx++}`);
        data.push(request.payload["reference_by_mobile_no"]);
    }
    if(request.payload["received_by"]) {
        cols.push("receivedBy");
        params.push(`$${idx++}`);
        data.push(request.payload["received_by"]);
    }
    if(request.payload["cheque_issue_date"]) {
        cols.push("chequeIssueDate");
        params.push(`$${idx++}`);
        data.push(request.payload["cheque_issue_date"]);
    }
    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.PAYMENT} (${scols}) values (${sparams})`;
    let sql = {
        text: query,
        values: data
    }
    try{
        return await Dao.execute_value(request.pg, sql)
        
    } 
    catch (err) {
        log.error(`An exception occurred while saving paymentReceive: ${err?.message}`)
    }
};

const getVendorNameList = async (userInfo, request) => {
    let list_data = [];
    let data = [userInfo.companyoid, request.payload["reference_oid"]];

    let table_name = TABLE.CUSTOMER;
    if(request.payload.reference_type == CONSTANT.SUPPLIER) {
        table_name = TABLE.SUPPLIER;
    }
    let query = `select oid, name from ${table_name} where 1 = 1  and companyOid = $1 and oid = $2`;
    let idx = 3;

    query += ` order by createdOn desc`;
    let sql = {
        text: query,
        values: data
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql);
        list_data = data_set.length < 1 ? null : data_set[0];
    } catch (e) {
        throw new Error(e);
    }
    return list_data;
}

module.exports = save_controller;
