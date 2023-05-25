"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE } = require("../../../util/constant");
const uuid = require("uuid");
const { autheticatedUserInfo } = require("../../../util/helper");


const payload_scheme = Joi.object({
    oid: Joi.string().trim().min(1).max(128).required(),
    reference_type: Joi.string().valid('Customer', 'Supplier', 'Expense').required(),
    account_oid: Joi.string().trim().min(1).max(128).required(),
    reference_oid: Joi.string().trim().min(1).max(128).required(),
    amount: Joi.number().min(1).max(128).required(),
    payment_date: Joi.string().trim().min(1).max(128).required(),
    payment_type: Joi.string().valid('Debit', 'Credit').required(),
    // payment_mode: Joi.string().valid('Cheque','BankDeposit', 'Cash', 'CreditCard', 'CreditNote').optional(),
    payment_nature: Joi.string().valid('CreditNote','Withdraw', 'CashWithdraw', 'CreditNoteAdjustment', 'CashAdjustment', 'VendorCredit').optional(),
    description:  Joi.string().trim().min(1).max(128).optional(),
    image_path:  Joi.string().trim().min(1).max(128).required(),
    status:  Joi.string().valid('Active','Inactive', 'Draft').required(),
    check_no:  Joi.string().trim().min(1).max(128).optional(),

    // due_invoice_list: Joi.array().items({
    //     oid: Joi.string().trim().min(1).max(128).required(),
    //     invoice_type: Joi.string().trim().min(1).max(32).required(),
    //     remarks: Joi.string().trim().min(1).optional(),
    //     amount: Joi.number().min(0).required(),
    //     status: Joi.string().valid('Draft', 'Active').required(),
    //     payment_oid: Joi.string().trim().min(1).max(128).required()
    // })
});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.PAYMENT_MADE_UPDATE_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "update",
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
        const userInfo = await autheticatedUserInfo(request)

        const update = await updatePaymentReceived(userInfo, request);

        if(update["rowCount"] == 1){
            log.info(MESSAGE.SUCCESS_UPDATE );
            return { status: true, code: 200, message: MESSAGE.SUCCESS_UPDATE };            
        }
        else if(update["rowCount"] == 0){
            log.info(MESSAGE.ALREADY_UPDATE);
            return { status: true, code: 202, message: MESSAGE.ALREADY_UPDATE };            
        } else{
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


const updatePaymentReceived = async (userInfo, request) => {
    const payment = request.payload;
    let cols = ["paymentDate = $1" , "amount = $2", "imagePath = $3", "status = $4", 
    "paymentType = $5", "referenceType = $6", "referenceOid = $7", "paymentNature = $8",
     "accountOid = $9", "editedBy = $10", "editedOn = $11" ];

    let data = [payment["payment_date"], payment["amount"],payment["image_path"],payment["status"],  payment["payment_type"], payment["reference_type"], payment["reference_oid"], payment["payment_nature"], payment["account_oid"], userInfo.loginid, 'now()' ];
    let idx = 12;

    if(payment["payment_mode"]) {
        cols.push(`paymentMode = $${idx++}`);
        data.push(payment["payment_mode"]);
    }
    if(payment["check_no"]) {
        cols.push(`checkNo = $${idx++}`);
        data.push(payment["check_no"]);
    }
    if(payment["description"]) {
        cols.push(`description = $${idx++}`);
        data.push(payment["description"]);
    }

    let sCols = cols.join(', ')

    let query = `update ${ TABLE.PAYMENT } set ${ sCols } where 1 = 1 and oid = $${ idx++ }`;
    data.push(payment.oid)
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
}




module.exports = save_controller;
