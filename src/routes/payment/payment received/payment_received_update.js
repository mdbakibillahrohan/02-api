"use strict";

const Joi = require("@hapi/joi");
const uuid = require('uuid');
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const payload_scheme = Joi.object({
    oid: Joi.string().trim().min(1).required(),
    payment_no: Joi.string().trim().min(1).max(128).required(),
    image_path: Joi.string().trim().min(1).max(256).required(),
    check_no: Joi.string().trim().min(1).max(128).optional(),
    status: Joi.string().trim().valid("Active", "Inactive").required(),
    description: Joi.string().trim().min(1).optional(),
    reference_type: Joi.string().trim().valid("Customer", "Supplier", "Expense").required(),
    reference_oid: Joi.string().trim().min(1).required(),
    account_oid: Joi.string().trim().min(1).required(),
    payment_nature: Joi.string().trim().valid("CashWithdraw", "CreditNoteAdjustment", "CashAdjustment", "VendorCredit").required(),
    payment_type: Joi.string().trim().valid("Debit", "Credit",).required(),
    payment_mode: Joi.string().trim().valid("Cheque", "BankDeposit", "Cash", "CreditCard", "CreditNote",).optional(),
    payment_date: Joi.date().required(),
    amount: Joi.number().required(),

    due_invoice_list: Joi.array().items(Joi.object({
        ref_invoice_type: Joi.string().trim().min(1).required(),
        ref_invoice_oid: Joi.string().trim().min(1).required(),
        amount: Joi.number().required(),
        remarks: Joi.string().trim().min(1).required(),
        status: Joi.string().trim().valid("Active", "Inactive").required(),
        payment_oid: Joi.string().trim().min(1).required(),
    })).required(),

});

const update_controller = {
    method: "POST",
    path: API.CONTEXT + API.PAYMENT_RECEIVED_UPDATE_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "update payment receieve information",
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
    let update_data_return;
    try {
        update_data_return = await update_data(request);
        if (update_data_return.status) {
            log.info(`Successfully updated`);
            return { status: true, code: 200, message: MESSAGE.SUCCESS_update };
        }
        log.info(update_data_return.message)
        return { status: false, code: 409, message: MESSAGE.INTERNAL_SERVER_ERROR };
    } catch (err) {
        log.error(`An exception occurred while saving passport info: ${err}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const update_data = async (request) => {
    try {
        const userInfo = await autheticatedUserInfo(request);
        request.payload.userInfo = userInfo;
        const { due_invoice_list } = request.payload;

        const update_payment_received = await updatePaymentReceived(request);
        if (!update_payment_received) {
            return {
                status: false,
                message: "Problem in update payment receive"
            }
        }

        const delete_invoice_bill_payment = await deleteInvoiceBillPayment(request, request.payload.oid);

        const due_invoice_list_execute = due_invoice_list.forEach(async (element) => {
            if (element.amount) {
                const execute = await updateInvoiceBillPayment(request, element, request.payload.oid);
                if (!execute) {
                    return false;
                }

            }
        });
        if (!due_invoice_list_execute) {
            return {
                status: false,
                message: "Problem in due invoice list execution"
            }
        }

        return {
            status: true
        }
    } catch (error) {
        throw error;
    }

};



const updatePaymentReceived = async (request) => {
    const { payment_no, payment_date, amount, image_path, status, payment_type, reference_type, reference_oid, payment_nature, account_oid, userInfo, payment_mode, check_no, description } = request.payload;
    let executed;
    let cols = [`paymentNo = $${idx++}`, `paymentDate = $${idx++}`, `amount = $${idx++}`, `imagePath = $${idx++}`,
        `status = $${idx++}`, `paymentType = $${idx++}`, `referenceType = $${idx++}`, `referenceOid = $${idx++}`, `paymentNature = $${idx++}`, `accountOid = $${idx++}`, `createdBy = $${idx++}`,
        `updatedOn = now()`, `companyOid  = $${idx++}`];
  
    let data = [payment_no, payment_date, amount, image_path, status, payment_type, reference_type, reference_oid, payment_nature, account_oid, userInfo.loginid, userInfo.companyoid]


    if (payment_mode) {
        cols.push(`paymentMode = $${idx++}`);
        params.push(`$${idx++}`);
        data.push(payment_mode);
    }

    if (check_no) {
        cols.push(`checkNo = $${idx++}`);
        data.push(check_no);
    }

    if (description) {
        cols.push(`description = $${idx++}`);
        data.push(description);
    }

    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `update ${TABLE.PAYMENT} set ${scols} where 1 = 1 and oid = ${oid}`;
    let sql = {
        text: query,
        values: data
    }
    try {
        executed = await Dao.execute_value(request.pg, sql);
    } catch (e) {
        throw new Error(e);
    }
    if (executed.rowCount > 0) {
        return true;
    }
    return false;
}




const saveInvoiceBillPayment = async (request, invoiceDetails, payment_oid) => {
    const { ref_invoice_type, ref_invoice_oid, amount, remarks, status } = invoiceDetails;
    const { userInfo } = request.payload;
    let executed;
    let idx = 1;
    let cols = ["oid", "refInvoiceType", "refInvoiceOid", "amount", "remarks",
        "status", "paymentOid", "companyOid"];
    let params = [`$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`,];
    const oid = uuid.v4();
    let data = [oid, ref_invoice_type, ref_invoice_oid, amount, remarks, status, payment_oid, userInfo.companyoid];



    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.INVOICE_BILL_PAYMENT} (${scols}) values (${sparams})`;
    let sql = {
        text: query,
        values: data
    }
    try {
        executed = await Dao.execute_value(request.pg, sql);
    } catch (e) {
        throw new Error(e);
    }
    if (executed.rowCount > 0) {
        return true;
    }
    return false;
}

const deleteInvoiceBillPayment = async(request, paymentOid)=>{
    let executed;
    let data = [paymentOid]
    let query = `delete from ${TABLE.INVOICE_BILL_PAYMENT}  where 1 = 1 and paymentOid = $1`;
    let sql = {
        text: query,
        values: data
    }
    try {
        executed = await Dao.execute_value(request.pg, sql);
    } catch (e) {
        throw new Error(e);
    }
    if (executed.rowCount > 0) {
        return true;
    }
    return false;
}

module.exports = update_controller;
