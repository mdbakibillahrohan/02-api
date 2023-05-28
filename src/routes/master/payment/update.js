"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");
const uuid = require("uuid");


const payload_scheme = Joi.object({
    oid: Joi.string().trim().min(1).max(128).required(),
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
    path: API.CONTEXT + API.MASTER_PAYMENT_UPDATE_PATH,
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


        const userInfo = await autheticatedUserInfo(request);
    
        const update = await update_data(userInfo, request);
        console.log(update)
        if( update["rowCount"] == 1)
        {
            log.info(MESSAGE.SUCCESS_UPDATE );
            return { 
                status: true, 
                code: 200, 
                message: MESSAGE.SUCCESS_UPDATE 
            };            
        }

        else if( update["rowCount"] == 0 ) {
            log.info(MESSAGE.ALREADY_UPDATE);
            return {
                    status: true, 
                    code: 202, 
                    message: MESSAGE.ALREADY_UPDATE 
                };            
        } 

        else{
            log.info(MESSAGE.USER_NOT_EXIST)
            return {
                status: true,
                code: 204,
                message: MESSAGE.USER_NOT_EXIST+ `or some other issue check oid`
            }
        }
        


    } catch (err) {
        log.error(`An exception occurred while saving: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const update_data = async (userInfo, request) => {
    let cols = ["paymentDate = $1" , "amount = $2", "imagePath = $3", "status = $4", "paymentType = $5", "referenceType = $6", "referenceOid = $7", "paymentNature = $8", "accountOid = $9", "editedBy = $10", "editedOn = $11"];

    let data = [request.payload["payment_date"], request.payload["amount"], request.payload["image_path"], request.payload["status"], request.payload["payment_type"], request.payload["reference_type"], request.payload["reference_oid"], request.payload["payment_nature"], request.payload["account_oid"], userInfo.loginid, 'now()'];

    let idx = 12;


    if(request.payload["check_no"]) {
        cols.push(`checkNo = $${idx++}`);
        data.push(request.payload["check_no"]);
    }
    if(request.payload["description"]) {
        cols.push(`description = $${idx++}`);
        data.push(request.payload["description"]);
    }
    if(request.payload["account_holder_name"]) {
        cols.push(`accountHolderName = $${idx++}`);
        data.push(request.payload["account_holder_name"]);
    }

    if(request.payload["bank_account_no"]) {
        cols.push(`bankAccountNo = $${idx++}`);
        data.push(request.payload["bank_account_no"]);
    }
    if(request.payload["bank_name"]) {
        cols.push(`bankName = $${idx++}`);
        data.push(request.payload["bank_name"]);
    }
    if(request.payload["branch_name"]) {
        cols.push(`branchName = $${idx++}`);
        data.push(request.payload["branch_name"]);
    }
    if(request.payload["payment_mode"]) {
        cols.push(`paymentMode = $${idx++}`);
        data.push(request.payload["payment_mode"]);
    }
    if(request.payload["reference_by"]) {
        cols.push(`referenceBy = $${idx++}`);
        data.push(request.payload["reference_by"]);
    }
    if(request.payload["reference_by_mobile_no"]) {
        cols.push(`referenceByMobileNo = $${idx++}`);
        data.push(request.payload["reference_by_mobile_no"]);
    }
    if(request.payload["received_by"]) {
        cols.push(`receivedBy = $${idx++}`);
        data.push(request.payload["received_by"]);
    }
    if(request.payload["cheque_issue_date"]) {
        cols.push(`chequeIssueDate = $${idx++}`);
        data.push(request.payload["cheque_issue_date"]);
    }
    let scols = cols.join(', ')

    let query = `update ${ TABLE.PAYMENT } set ${scols} where 1 = 1 and oid = $${idx++}`;
    data.push(request.payload["oid"])
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


module.exports = save_controller;
