"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, TABLE, MESSAGE } = require("../../../util/constant");

const query_scheme = Joi.object({
    oid: Joi.string().trim().min(1).max(128).required(),
});

const get_by_oid = {
    method: "GET",
    path: API.CONTEXT + API.PAYMENT_RECEIVED_GET_BY_OID_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "get payment received information by oid",
        plugins: { hapiAuthorization: false },
        validate: {
            query: query_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 301, status: false, message: err }).takeover();
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
        let data = await get_data(request);
        if (data.status) {
            log.info(`company data found by oid`);
            return {
                status: true,
                code: 200,
                message: MESSAGE.SUCCESS_GET_BY_OID,
                data: data.data
            };
        }
        return {
            status: false,
            code: 200,
            message: data.message
        }

    } catch (err) {
        log.error(err);
    }
};

const get_data = async (request) => {
    const paymentReceived = await getPaymentReceived(request);
    const invoiceBillPayment = await getInvoiceBillPayment(request);
    if (!paymentReceived && paymentReceived != null) {
        return {
            status: false,
            message: "Problem in getting Payment Received"
        }
    }
    if (!invoiceBillPayment && invoiceBillPayment != null) {
        return {
            status: false,
            message: "Problem in Invoice bill payment"
        }
    }
    const data = {
        payment_received: paymentReceived ?? "Data not found",
        invoice_bill_payment: invoiceBillPayment ?? "Data not found"
    }

    return {
        data,
        status: true
    }
};


const getPaymentReceived = async (request) => {
    let data = null, query = null;
    query = `select p.oid, p.paymentNo as "payment_no", to_char(p.paymentDate, 'YYYY-MM-DD') as "payment_date",
    p.checkNo as "check_no", p.status, p.paymentType as "payment_type", p.referenceOid as "reference_oid", p.referenceType as "reference_type", p.amount,
    p.entryType as "entry_type", p.accountOid as "account_oid", p.description, p.imagePath as "image_path", p.paymentNature as "payment_nature" 
    from ${TABLE.PAYMENT} p 
    where 1 = 1 and p.oid = $1`;
    let sql = {
        text: query,
        values: [request.query.oid]
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql);
        data = data_set.length < 1 ? null : data_set[0];
    } catch (e) {
        log.error(`An exception occurred while getting data by oid: ${e}`);
    }
    return data;
}
const getInvoiceBillPayment = async (request) => {
    let data = null, query = null;
    query = `select oid, refInvoiceType as "refInvoice_type", amount, remarks, status, paymentOid as "payment_oid", refInvoiceOid as "ref_invoice_oid", companyOid as "company_oid"
    from  ${TABLE.INVOICE_BILL_PAYMENT}
    where 1 = 1 and paymentOid = $1`;
    let sql = {
        text: query,
        values: [request.query.oid]
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql);
        data = data_set.length < 1 ? null : data_set[0];
    } catch (e) {
        log.error(`An exception occurred while getting data by oid: ${e}`);
    }
    return data;
}

module.exports = get_by_oid;
