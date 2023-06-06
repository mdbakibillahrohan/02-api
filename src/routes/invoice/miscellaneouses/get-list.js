"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const query_scheme = Joi.object({

    status: Joi.string().trim().min(1).max(32).optional(),
    source: Joi.string().trim().min(1).max(320).optional(),
    customerOid: Joi.string().trim().min(1).max(228).optional(),
    supplierOid: Joi.string().trim().min(1).max(228).optional(),
    invoiceNo: Joi.string().trim().min(1).max(228).optional(),
    searchText: Joi.string().trim().allow(null, '').max(128).optional(),
    offset: Joi.number().allow(null, '').max(100000000000).optional(),
    limit: Joi.number().allow(null, '').max(100000000000).optional(),
})

const route_controller = {
    method: "GET",
    path: API.CONTEXT + API.INVOICE_MISCELLANEOUSES_GET_LIST_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Invoice Miscellaneouses List",
        plugins: {
            hapiAuthorization: false,
        },
        validate: {
            query: query_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h.response({
                    code: 400, status: false, message: err
                }).takeover();
            },
        },
    },
    handler: async (request, h) => {
        log.info(`Request received - ${JSON.stringify(request.query)}`);
        const response = await handle_request(request);
        log.debug(`Response sent - ${JSON.stringify(response)}`)
        return h.response(response);
    },
};

const handle_request = async (request) => {
    try {
        let count = await getDataCount(request);
        let data = [];
        if (count == 0) {
            log.info(MESSAGE.NO_DATA_FOUND);
            return {
                status: false,
                code: 400,
                message: MESSAGE.NO_DATA_FOUND
            };
        }
        data = await getDataList(request);
        log.info(`[${count}] found`)

        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_LIST,
            data,
            count
        };
    } catch (err) {
        log.error(`An exception occurred while getting ticket list : ${err}`)
        return {
            status: false,
            code: 500,
            message: MESSAGE.INTERNAL_SERVER_ERROR
        };
    }
};
const getDataCount = async (request) => {
    let userInfo = await autheticatedUserInfo(request)
    let count = 0;
    let data = [];

    let query = `select count(t.oid)
        from ${TABLE.TICKET_INVOICE} as t 
        left join ${TABLE.CUSTOMER} as c on c.oid = t.customerOid 
        where 1 = 1 and t.companyOid = $1 `;

    data.push(userInfo.companyoid);

    let idx = 2;

    if (request.query["customerOid"]) {
        query += ` and t.customerOid = ${idx++}`;
        data.push(request.query["customerOid"])
    }
    if (request.query["supplierOid"]) {
        query += ` and t.supplierOid = ${idx++}`;
        data.push(request.query["supplierOid"])
    }

    if (request.query["status"]) {
        query += ` and t.status =  ${idx++}`;
        data.push(request.query["status"])
    }

    if (request.query["source"]) {
        query += ` and t.source = ${idx++}`;
        data.push(request.query["source"])
    }
    if (request.query["invoiceNo"]) {
        query += ` and t.invoiceNo ilike % ${request.query["invoiceNo"]} %`;
        data.push(request.query["invoiceNo"])
    }

    if (request.query["searchText"]) {
        query += ` and t.invoiceNo ilike $${idx} or 
            c.name ilike $${idx++} `;
        data.push(`% ${request.query["searchText"].trim()} %`)
    }
    let sql = {
        text: query,
        values: data
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql);
        count = data_set[0]["count"];
        log.info(count)

    } catch (err) {
        log.error(`An exception occurred while getting ticket list count : ${err}`);

        // throw new Error(err);
    }
    return count;
}
const getDataList = async (request) => {
    const userInfo = await autheticatedUserInfo(request);
    let list_data = [];
    let data = [];

    let query = `select t.oid, t.invoiceForWhom as invoice_for_whom, t.invoiceNo as invoice_no, 
        t.purchasePrice as purchase_price, t.netSalesPrice as net_sales_price,
        t.netPurchasePrice as net_purchase_price, t.payableAmount as payable_amount, 
        t.receivableAmount as receivable_amount, to_char(t.invoiceDate, 'YYYY-MM-DD') as 
        invoice_date, to_char(t.invoiceDate :: DATE, 'dd-Mon-yyyy') as invoice_date_en, 
        t.status, t.source, t.lifeCycle as life_cycle, 
        ticket_invoice_received_amount(t.customeroid, t.oid) as received_amount, ticket_invoice_paid_amount(t.supplierOid, t.oid) as paid_amount, 
        t.customerOid as customer_oid, c.name as customer_name, 
        s.name as supplier_name from ${TABLE.TICKET_INVOICE} as t left join 
        ${TABLE.CUSTOMER} as c on c.oid = t.customerOid left join 
        ${TABLE.SUPPLIER} as s on s.oid = t.supplierOid where 1 = 1 and
        t.companyOid = $1`;


    data.push(userInfo.companyoid);

    let idx = 2;

    if (request.query["customerOid"]) {
        query += ` and t.customerOid = ${idx++}`;
        data.push(request.query["customerOid"])
    }
    if (request.query["supplierOid"]) {
        query += ` and t.supplierOid = ${idx++}`;
        data.push(request.query["supplierOid"])
    }

    if (request.query["status"]) {
        query += ` and t.status =  ${idx++}`;
        data.push(request.query["status"])
    }

    if (request.query["source"]) {
        query += ` and t.source = ${idx++}`;
        data.push(request.query["source"])
    }
    if (request.query["invoiceNo"]) {
        query += ` and t.invoiceNo ilike % ${request.query["invoiceNo"]} %`;
        data.push(request.query["invoiceNo"])
    }

    if (request.query["searchText"]) {
        query += ` and t.invoiceNo ilike $${idx} or 
            c.name ilike $${idx++} `;
        data.push(`% ${request.query["searchText"].trim()} %`)
    }

    query += ` order by t.invoiceDate desc`;

    if (request.query.offset) {
        query += ` offset $${idx++}`;
        data.push(request.query.offset);
    }
    if (request.query.limit) {
        query += ` limit $${idx++}`;
        data.push(request.query.limit)
    }
    let sql = {
        text: query,
        values: data
    }
    try {
        list_data = await Dao.get_data(request.pg, sql);
    } catch (e) {
        log.error(`An exception occurred while getting ticket list : ${err}`)
        // throw new Error(e);
    }
    return list_data;
}
module.exports = route_controller;
