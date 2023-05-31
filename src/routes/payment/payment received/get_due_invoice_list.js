"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const query_scheme = Joi.object({
    customer_oid: Joi.string().trim().min(1).required(),
    status: Joi.string().trim().valid("Active", "Inactive").required(),

    search_text: Joi.string().trim().min(1).optional(),
});

const get_list = {
    method: "GET",
    path: API.CONTEXT + API.PAYMENT_RECEIVED_GET_DUE_INVOICE_LIST_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Payment receive get due invoice list",
        plugins: { hapiAuthorization: false },
        validate: {
            query: query_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 400, status: false, message: err }).takeover();
            },
        },
    },
    handler: async (request, h) => {
        log.info(`Request received - ${JSON.stringify(request.query)}`);
        const response = await handle_request(request);
        log.debug(`Response sent - ${JSON.stringify(response)}`);
        return h.response(response);
    },
};

const handle_request = async (request) => {
    try {
        const userInfo = await autheticatedUserInfo(request);
        request.query.userInfo = userInfo;
        let count = await get_count(request);
        let data = [];
        if (count == 0) {
            log.info(`No data found`);
            return { status: false, code: 400, message: `No data found` };
        }
        data = await get_data(request)
        log.info(`[${count}] found`);
        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_LIST,
            data: data,
            count: count
        };
    } catch (err) {
        log.error(`An exception occurred while getting payment due invoice list data : ${err}`);
        return {
            status: false,
            code: 500,
            message: MESSAGE.INTERNAL_SERVER_ERROR
        };
    }
};

const get_count = async (request) => {
    const { customer_oid, status, userInfo } = request.query;
    let count = 0;
    let data = [customer_oid, userInfo.companyoid, status];
    let query = `select count(t.oid) as total
    from ${TABLE.TICKET_INVOICE} t 
    where t.customerOid = $1 and t.companyOid = $2 and t.status = $3 
    and (t.receivableAmount - (ticket_invoice_received_amount(t.customeroid, t.oid))) > 0`;
    if (request.query['search_text']) {
        const searchText = '%' + request.query['search_text'].trim().toLowerCase() + '%';
        query += ` and t.invoiceNo ilike $4`;
        data.push(searchText);
    }
    let sql = {
        text: query,
        values: data
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql);
        count = data_set[0]["total"];
    } catch (e) {
        throw new Error(e);
    }
    return count;
};

const get_data = async (request) => {
    const { customer_oid, status, userInfo } = request.query;
    let list_data = [];
    let data = [customer_oid, userInfo.companyoid, status];
    let query = `select 'Ticket' as "invoice_type", t.source, t.supplierOid as "supplier_oid", t.customerOid as "customer_oid", t.companyOid as "company_oid", t.oid, t.status, 
    t.invoiceNo as "invoice_no", to_char(t.invoiceDate, 'YYYY-MM-DD') as "invoice_date", 
    to_char(t.invoiceDate :: DATE, 'dd-Mon-yyyy') as "invoice_date_en", 
    t.purchasePrice as "purchase_price", t.netSalesPrice as "invoice_amount", 
    t.netPurchasePrice as "net_purchase_price", t.payableAmount as "payable_amount", t.receivableAmount as "receivable_amount", 
    ticket_invoice_received_amount(t.customeroid, t.oid) as "received_amount", 
    (t.receivableAmount - (ticket_invoice_received_amount(t.customeroid, t.oid))) as "due_amount" 
    from ${TABLE.TICKET_INVOICE} t 
    where t.customerOid = $1 and t.companyOid = $2 and t.status = $3 
    and (t.receivableAmount - (ticket_invoice_received_amount(t.customeroid, t.oid))) > 0`;

    if (request.query['search_text']) {
        const searchText = '%' + request.query['search_text'].trim().toLowerCase() + '%';
        query += ` and t.invoiceNo ilike $4`;
        data.push(searchText);
    }

    let sql = {
        text: query,
        values: data
    }
    try {
        list_data = await Dao.get_data(request.pg, sql);
    } catch (e) {
        throw new Error(e);
    }
    return list_data;
};

module.exports = get_list;
