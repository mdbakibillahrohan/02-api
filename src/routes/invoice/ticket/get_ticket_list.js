"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const query_scheme = Joi.object({
    customerOid: Joi.string().trim().max(128).optional(),
    supplierOid: Joi.string().trim().max(128).optional(),
    invoiceStatus: Joi.string().trim().max(128).optional(),
    ticketNo: Joi.string().trim().max(128).optional(),
    searchText: Joi.string().trim().allow(null, '').max(128).optional(),
    offset: Joi.number().allow(null, '').max(99999999).optional(),
    limit: Joi.number().allow(null, '').max(99999999).optional(),
});

const get_list = {
    method: "GET",
    path: API.CONTEXT + API.INVOICE_TICKET_GET_TICKET_LIST,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Ticket list of Invoice Ticket List",
        plugins: { hapiAuthorization: false },
        validate: {
            query: query_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 400, status: false, message: err?.message }).takeover();
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
            data,
            count
        };
    } catch (err) {
        log.error(`An exception occurred while getting invoice ticket, ticket list data : ${err?.message}`);
        return {
            status: false,
            code: 500,
            message: MESSAGE.INTERNAL_SERVER_ERROR
        };
    }
};

const get_count = async (request) => {
    const userInfo = await autheticatedUserInfo(request);
    let count = 0;
    let data = [];
    let query = `select count(ti.oid) as total from ${TABLE.TICKET_INVOICE} ti left join ${TABLE.TICKET} t on t.ticketInvoiceOid = ti.oid left join ${TABLE.CUSTOMER} c on c.oid = ti.customerOid where 1 = 1`;
    let idx = 1;
    query += ` and ti.companyoid = $${idx++}`;
    data.push(userInfo.companyoid);


    if (request.query['customerOid']) {
        query += ` and ti.customerOid = $${idx++}`;
        data.push(request.query["customerOid"]);
    }
    if (request.query['supplierOid']) {
        query += ` and ti.supplierOid = $${idx++}`;
        data.push(request.query["supplierOid"]);
    }
    if (request.query['invoiceStatus']) {
        query += ` and ti.status = $${idx++}`;
        data.push(request.query["invoiceStatus"]);
    }

    if (request.query['ticketNo']) {
        const ticketNo = `%${request.query['ticketNo']}%`
        query += ` and t.ticketNo like $${idx++}`;
        data.push(ticketNo);
    }

    if (request.query['searchText']) {
        query += ` and ti.invoiceNo ilike $${idx} 
        or t.ticketNo ilike $${idx} or t.pnr ilike $${idx}) or c.name ilike $${idx++})`;
        data.push(`%${request.query['searchText'].trim()}%`);
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
    const userInfo = await autheticatedUserInfo(request);
    let list_data = [];
    let data = [];
    let query = `select ti.invoiceNo as "invoice_no", to_char(ti.invoiceDate, 'YYYY-MM-DD') as "invoice_date",
    ti.status as "invoice_status", t.payableAmount as "payable_amount", t.receivableAmount as "receivable_amount", c.name as "customer_name", 
    t.oid, t.ticketNo as "ticket_no", to_char(t.issueDate, 'YYYY-MM-DD') as "issue_date", 
    to_char(t.issueDate :: DATE, 'dd-Mon-yyyy') as "issue_date_en", 
    t.paxName as "pax_name", t.passengerType as "passenger_type",
    t.pnr, t.purchasePrice as "purchase_price", t.netSalesPrice as "net_sales_price", t.netPurchasePrice as "net_purchase_price", t.status, t.ticketInvoiceOid as "ticket_invoice_oid", t.departureCardOid as "departure_card_oid" 
    from ${TABLE.TICKET_INVOICE} ti
    left join ${TABLE.TICKET} t on t.ticketInvoiceOid = ti.oid 
    left join ${TABLE.CUSTOMER} c on c.oid = ti.customerOid 
    where 1 = 1`;
    let idx = 1;
    query += ` and ti.companyoid = $${idx}`;
    idx++;
    data.push(userInfo.companyoid);
    if (request.query['customerOid']) {
        query += ` and ti.customerOid = $${idx++}`;
        data.push(request.query["customerOid"]);
    }
    if (request.query['supplierOid']) {
        query += ` and ti.supplierOid = $${idx++}`;
        data.push(request.query["supplierOid"]);
    }
    if (request.query['invoiceStatus']) {
        query += ` and ti.status = $${idx++}`;
        data.push(request.query["invoiceStatus"]);
    }

    if (request.query['ticketNo']) {
        const ticketNo = `%${request.query['ticketNo']}%`
        query += ` and t.ticketNo like $${idx++}`;
        data.push(ticketNo);
    }

    if (request.query['searchText']) {
        query += ` and ti.invoiceNo ilike $${idx} 
        or t.ticketNo ilike $${idx} or t.pnr ilike $${idx}) or c.name ilike $${idx++})`;
        data.push(`%${request.query['searchText'].trim()}%`);
    }
    query += ` order by ti.invoiceDate desc`;
    if (request.query.offset) {
        query += ` offset $${idx++}`;
        data.push(request.query.offset);
    }
    if (request.query.limit) {
        query += ` limit $${idx++}`;
        data.push(request.query.limit);
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
