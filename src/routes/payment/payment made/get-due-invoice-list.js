"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE , CONSTANT} = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const query_scheme = Joi.object({
    supplier_oid: Joi.string().trim().allow(null, '').max(128).required(),
    customer_oid: Joi.string().trim().allow(null, '').max(128).required(),
    offset: Joi.number().allow(null, '').max(99999999).optional(),
    limit: Joi.number().allow(null, '').max(99999999).optional(),
})

const route_controller = {
    method: "GET",
    path: API.CONTEXT + API.PAYMENT_MADE_GET_DUE_INVOICE_LIST_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Payment Made Get Due Invoice List",
        plugins: {
            hapiAuthorization: false,
        },
        validate: {
            query: query_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async(request, h, err) => {
                return h.response({
                    code: 400, status: false, message: err?.message
                }).takeover();
            },
        },
    },
    handler: async(request, h) => {
        log.info(`Request received - ${JSON.stringify(request.query)}`);
        const response = await handle_request(request);
        log.debug(`Response sent - ${JSON.stringify(response)}`)
        return h.response(response);
    },
};

const handle_request = async (request) => {
    try {
        let userInfo = await autheticatedUserInfo(request)
        let count = await get_count(userInfo, request);
        
        let data = [];
        if (count == 0){
            log.info(MESSAGE.NO_DATA_FOUND);
            return { 
                status: false, 
                code:400,
                message: MESSAGE.NO_DATA_FOUND 
            };
        }
        data = await get_data(userInfo, request);
        log.info(`[${count}] found`)
        
        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_LIST,
            count,
            data,
        };
    } catch( err ){
        log.error(`An exception occurred while getting supplier list data: ${err?.message}`);
        return {
            status: false,
            code: 500,
            message: MESSAGE.INTERNAL_SERVER_ERROR
        };
    }
};
const get_count = async (userInfo, request) => {
    
    let count = 0;
    let data = [];
    
    let query = `select count(t.oid)::int4 as total from ${ TABLE.TICKET_INVOICE } as t
        where t.customerOid = $1 and t.companyOid = $2 and t.status = $3 and 
        (t.payableAmount - (ticket_invoice_paid_amount(t.supplierOid, t.oid))) > 0`;

    data.push( request.query['customer_oid'], userInfo.companyoid, CONSTANT.ACTIVE);

    let idx = 4;

    if (request.query['searchText']) {
        query += ` and t.invoiceNo ilike $${idx++}`;
        data.push('%' + request.query['searchText'].trim() + '%');
    }
    let sql = {
        text: query,
        values: data
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql);
        count = data_set[0]["total"];
        log.info(count)
    } catch (err) {
        log.error(err)
        throw new Error(err);
    }
    return count;
}
const get_data = async (userInfo,  request) => {
    
    let list_data = [];
    let data = [];
    let query = `select 'Ticket' as invoice_type, t.supplierOid as supplier_oid, 
        t.customerOid as customer_oid, t.companyOid as company_oid, t.oid, 
        t.invoiceNo as invoice_no, to_char(t.invoiceDate, 'YYYY-MM-DD') as invoice_date,
        to_char(t.invoiceDate :: DATE, 'dd-Mon-yyyy') as invoice_date_en,
        t.netSalesPrice as invoice_amount, t.purchasePrice as bill_amount, t.netSalesPrice as net_sales_price, t.purchasePrice as purchase_price, t.netPurchasePrice as net_purchase_price, t.payableAmount as payable_amount, t.receivableAmount as receivable_amount,
        ticket_invoice_paid_amount(t.supplierOid, t.oid) as paid_amount,
        (t.payableAmount - (ticket_invoice_paid_amount(t.supplierOid, t.oid))) as due_amount 
        from ${ TABLE.TICKET_INVOICE } as t where t.supplierOid = $1 and t.companyOid = $2 and 
        t.status = $3 and (t.payableAmount - (ticket_invoice_paid_amount(t.supplierOid, t.oid))) > 0`;

    data.push( request.query["supplier_oid"], userInfo.companyoid, CONSTANT.ACTIVE);

    let idx = 4;

    if (request.query['searchText']) {
        query += ` and t.invoiceNo ilike $${idx++}`;
        data.push('%' + request.query['searchText'].trim() + '%');
    }

    query += ` order by p.paymentDate desc`;

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
        throw new Error(e);
    }
    return list_data;
}
module.exports = route_controller;
 