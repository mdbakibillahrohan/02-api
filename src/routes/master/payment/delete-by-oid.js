"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, TABLE, MESSAGE } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const payload_scheme = Joi.object({
    oid: Joi.string().trim().min(1).max(128).required()
});

const delete_by_oid = {
    method: "POST",
    path: API.CONTEXT +  API.MASTER_PAYMENT_DELETE_BY_OID_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "delete by oid",
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
        log.debug(`Request received - ${JSON.stringify(request.query)}`);
        const response = await handle_request(request);
        log.debug(`Response sent - ${JSON.stringify(response)}`);
        return h.response(response);
    },
};

const handle_request = async (request) => {
    try {
        const deletePayment = await getDeletePayment(request);
        const deleteInvoiceBillPayment = await getDeleteInvoiceBillPayment(request);
        const delete_payment = deletePayment? deletePayment : null ;
        const delete_invoice_bill_payment =  deleteInvoiceBillPayment? deleteInvoiceBillPayment: null
        console.log(delete_payment)
        console.log(delete_invoice_bill_payment)

        if( delete_payment != null & delete_invoice_bill_payment != null) {
            if( delete_payment["rowCount"] == 1 && delete_invoice_bill_payment["rowCount"] == 1) {
                log.info(`delete data by oid`);
                return {
                    status: true,
                    code: 200,
                    message: MESSAGE.SUCCESS_DELETE,
    
                };            
            }  

            else if( delete_payment["rowCount"] == 0 && delete_invoice_bill_payment["rowCount"] == 0) {
                log.info(MESSAGE.USER_NOT_EXIST);
                return {
                    status: true,
                    code: 202,
                    message: MESSAGE.USER_NOT_EXIST,
    
                };            
            }
            else if( delete_payment["rowCount"] == 1 && delete_invoice_bill_payment["rowCount"] == 0) {
                log.info(`delete data by oid`);
                return {
                    status: true,
                    code: 200,
                    message: `payment table `+MESSAGE.SUCCESS_DELETE + ' but invoice bill payment tabel '+ MESSAGE.USER_NOT_EXIST,
    
                };             
            }
        }
        else {

            log.info(MESSAGE.INTERNAL_SERVER_ERROR)
            return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
        }


    } catch (err) {
        log.error(`An exception occurred while deleting: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const getDeletePayment = async (request) => {
    let sql = {
        text: `delete from ${ TABLE.PAYMENT } where 1 = 1 and oid = $1`,
        values: [request.payload.oid]
    }
    try {
        return await Dao.execute_value(request.pg, sql)
    } catch (err) {
        log.error(`An exception occurred while removing data by oid: ${err}`);
    }
};

const getDeleteInvoiceBillPayment = async (request) => {
    let sql = {
        text: `delete from ${ TABLE.INVOICE_BILL_PAYMENT } where 1 = 1 and paymentOid = $1`,
        values: [request.payload.oid]
    }
    try {
        return await Dao.execute_value(request.pg, sql)
    } catch (err) {
        log.error(`An exception occurred while removing data by oid: ${err}`);
    }
    
};
module.exports = delete_by_oid;
