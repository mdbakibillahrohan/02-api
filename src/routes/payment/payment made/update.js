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
    amount: Joi.number().required(),
    payment_date: Joi.string().trim().min(1).max(128).required(),
    payment_type: Joi.string().valid('Debit', 'Credit').required(),
    payment_mode: Joi.string().valid('Cheque','BankDeposit', 'Cash', 'CreditCard', 'CreditNote').optional(),
    payment_nature: Joi.string().valid('CreditNote','Withdraw', 'CashWithdraw', 'CreditNoteAdjustment', 'CashAdjustment', 'VendorCredit').optional(),
    description:  Joi.string().trim().min(1).max(128).optional(),
    image_path:  Joi.string().trim().min(1).max(128).required(),
    status:  Joi.string().valid('Active','Inactive', 'Draft').required(),
    check_no:  Joi.string().trim().min(1).max(128).optional(),

    due_invoice_list: Joi.array().items({
        oid: Joi.string().trim().min(1).max(128).required(),
        invoice_type: Joi.string().trim().min(1).max(32).required(),
        remarks: Joi.string().trim().min(1).optional(),
        amount: Joi.number().required(),
        status: Joi.string().valid('Draft', 'Active').required(),
    })
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
        const userInfo = await autheticatedUserInfo(request);

        const payment = await ready(request, request.payload["oid"]);
        const update = await update_data(userInfo, payment, request);

        if (update.update_payment_received_rowCount != null && update.due_invoice_list_rowCount != null && update.delete_invoice_bill_payment_rowCount != null) {

            if( update.update_payment_received_rowCount == 1 || update.due_invoice_list_rowCount == 1 || update.delete_invoice_bill_payment_rowCount == 1 )
            {
                log.info(MESSAGE.SUCCESS_UPDATE );
                return { 
                    status: true, 
                    code: 200, 
                    message: MESSAGE.SUCCESS_UPDATE 
                };            
            }

            else if( update.update_payment_received_rowCount == 0 && update.due_invoice_list_rowCount == 0 && update.delete_invoice_bill_payment_rowCount == 0 )
            {
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
        } 
        else{
            log.error(`An exception occurred while saving: ${err?.message}`);
            return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
        }



    } catch (err) {
        log.error(`An exception occurred while saving: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const update_data = async (userInfo, payment, request) => {
    try {
        const save_payment_received = await updatePaymentReceived(userInfo, payment, request);
        const delete_invoice_bill_payment = await deleteInvoiceBillPayment(payment.oid, request)
        let due_invoice_list = null
        for(let invoice of payment["due_invoice_list"]) {
            if(invoice.amount > 0){
                due_invoice_list =  await saveInvoiceBillPayment(userInfo, invoice, request);
                
            }
        }
        // console.log("save_payment",save_payment_received)
        const output = {
            update_payment_received_rowCount: "number" == typeof(save_payment_received["rowCount"])? save_payment_received["rowCount"]: null,
            due_invoice_list_rowCount: "number" == typeof(due_invoice_list["rowCount"])? due_invoice_list: null,
            delete_invoice_bill_payment_rowCount: "number" == typeof(delete_invoice_bill_payment["rowCount"])? due_invoice_list: null
        }

        return output;
    } catch (err) {
        log.error("An exception occurred while save : ", err);
        
    }
}

const updatePaymentReceived = async (userInfo, payment, request) => {
    
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
const deleteInvoiceBillPayment = async (paymentOid, request) => {

    let query = `delete from ${ TABLE.INVOICE_BILL_PAYMENT } where 1 = 1 and paymentOid = $1`;
    let sql = {
        text: query,
        values: [paymentOid]
    }
    try{
        
        return await Dao.execute_value(request.pg, sql)
    } 
    catch (err) {
        log.error(`An exception occurred while deleting invoice bill payment: ${err?.message}`)
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
            account_oid: request.payload["account_oid"],
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
