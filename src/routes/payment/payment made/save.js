"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE } = require("../../../util/constant");
const uuid = require("uuid");
const { autheticatedUserInfo } = require("../../../util/helper");


const payload_scheme = Joi.object({

    reference_type: Joi.string().valid('Customer', 'Supplier', 'Expense').required(),
    account_oid: Joi.string().trim().min(1).max(128).required(),
    reference_oid: Joi.string().trim().min(1).max(128).required(),
    amount: Joi.number().min(1).max(128).required(),
    payment_date: Joi.string().trim().min(1).max(128).required(),
    payment_type: Joi.string().valid('Debit', 'Credit').required(),
    payment_mode: Joi.string().valid('Cheque','BankDeposit', 'Cash', 'CreditCard', 'CreditNote').optional(),
    payment_nature: Joi.string().valid('CreditNote','Withdraw', 'CashWithdraw', 'CreditNoteAdjustment', 'CashAdjustment', 'VendorCredit').optional(),
    description:  Joi.string().trim().min(1).max(128).optional(),
    image_path:  Joi.string().trim().min(1).max(128).required(),
    status:  Joi.string().valid('Active','Inactive', 'Draft').required(),
    check_no:  Joi.string().trim().min(1).max(128).optional(),

    due_invoice_list: Joi.array().items({
        ref_invoice_oid: Joi.string().trim().min(1).max(128).required(),
        ref_invoice_type: Joi.string().trim().min(1).max(128).required(),
        remarks: Joi.string().trim().min(1).max(128).required(),
        amount: Joi.number().min(1).max(128).required(),
        status: Joi.string().valid('Draft', 'Active').required(),
        payment_oid: Joi.string().trim().min(1).max(128).required()
    })
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
        const userInfo = await autheticatedUserInfo(request)
        // console.log("user",userInfo)
        const payment = await ready(request, uuid.v4());

        const save = await save_data(userInfo, payment, request);
        
        if(save.save_payment_received_rowCount != null && save.due_invoice_list_rowCount != null){
            log.info(`Successfully saved`);
            return { status: true, code: 200, message: MESSAGE.SUCCESS_SAVE };            
        }


    } catch (err) {
        log.error(`An exception occurred while saving: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const save_data = async (userInfo, payment, request) => {
    try {
        const save_payment_received = await savePaymentReceived(userInfo, payment, request);
 
        let due_invoice_list = null
        for(let invoice of payment["due_invoice_list"]) {
            if(invoice.amount > 0){
                due_invoice_list =  await saveInvoiceBillPayment(userInfo, invoice, request);
                
            }
        }
        // console.log("save_payment",save_payment_received)
        const output = {
            save_payment_received_rowCount: "number" == typeof(save_payment_received["rowCount"])? save_payment_received["rowCount"]: null,
            due_invoice_list_rowCount: "number" == typeof(due_invoice_list["rowCount"])? due_invoice_list: null
        }

        return output;
    } catch (err) {
        log.error("An exception occurred while save : ", err);
        
    }
}
const savePaymentReceived = async (userInfo, payment, request) => {
    
    let cols = ["oid", "paymentNo", "paymentDate", "amount", "imagePath", 
        "status", "paymentType", "referenceType", "referenceOid", "paymentNature", 
        "accountOid", "createdBy", "createdOn", "companyOid"];

    let params = ['$1', '$2', '$3', '$4', '$5', '$6', '$7', '$8', '$9', '$10', '$11', '$12', '$13', '$14'];
    let data = [payment["oid"], payment["payment_no"], payment["payment_date"], payment["amount"], payment["image_path"], payment["status"], payment["payment_type"], payment["reference_type"], payment["reference_oid"], payment["payment_nature"], payment["account_oid"], userInfo.loginid, 'now()', userInfo.companyoid ];
    let idx = 15;

    if(payment["payment_mode"]) {
        cols.push("paymentMode");
        params.push(`$${idx++}`);
        data.push(payment["payment_mode"]);
    }
    if(payment["check_no"]) {
        cols.push("checkNo");
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
        console.log('re')
        return await Dao.execute_value(request.pg, sql)
        
    } 
    catch (err) {
        log.error(`An exception occurred while saving paymentReceive: ${err?.message}`)
    }
}

const saveInvoiceBillPayment = async (userInfo, invoice, request) => {
    let cols = ["oid", "refInvoiceType", "refInvoiceOid", "amount", "remarks", 
    "status", "paymentOid", "companyOid"];

    let params = ['$1', '$2', '$3', '$4', '$5', '$6', '$7', '$8'];

    let data = [invoice["oid"], invoice["ref_invoice_type"], invoice["ref_invoice_oid"], invoice["amount"], invoice["remarks"], invoice["status"], invoice["payment_oid"], userInfo.companyoid ];


    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.INVOICE_BILL_PAYMENT} (${scols}) values (${sparams})`;
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

const ready = async (request, paymentOid) => {
    try {
        let invoiceList =  [];
    
        request.payload["due_invoice_list"].forEach(async invoice =>  {
            const oid = uuid.v4();
    
            let ticketObj = {
                oid: oid,
                ref_invoice_oid: invoice.oid,
                ref_invoice_type: invoice.invoice_type,
                remarks: invoice.remarks,
                amount: invoice.amount,
                status: invoice.status,
                payment_oid: paymentOid
            }
            invoiceList.push(ticketObj)
        })
        let paymantId = `${new Date().toISOString().slice(0,10).replace(/-/g, '')}`+`${new Date().toISOString().slice(11,19).replace(/:/g, '')}`;
        const payment = {
            oid: paymentOid,
            payment_no: paymantId,
            reference_type: request.payload["reference_type"],
            account_oid: request.payload["account_type"],
            reference_oid: request.payload["reference_oid"],
            amount: request.payload["amount"],
            payment_date: request.payload["payment_date"],
            payment_type: request.payload["payment_type"],
            payment_mode: request.payload["payment_mode"],
            payment_nature: request.payload["payment_nature"],
            description: request.payload["description"],
            image_path: request.payload["image_path"],
            status: request.payload["status"],
            check_no: request.payload["check_no"],
            due_invoice_list: invoiceList
        }
        return payment
    }
    catch (err) {
        log.error(`An exception occurred while ready function:${err?.message}`)
    }
}
module.exports = save_controller;
