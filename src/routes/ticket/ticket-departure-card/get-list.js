"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const query_scheme = Joi.object({
    invoiceNO: Joi.string().trim().allow(null, '').max(128).optional(),
    searchText: Joi.string().trim().allow(null, '').max(128).optional(),
    offset: Joi.number().allow(null, '').max(99999999).optional(),
    limit: Joi.number().allow(null, '').max(99999999).optional(),
})

const route_controller = {
    method: "GET",
    path: API.CONTEXT + API.TICKET_DEPARTURE_CARD_GET_LIST_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Ticket Modification Get List",
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
        let count = await get_count(request);
        
        let data = [];
        if (count == 0){
            log.info(MESSAGE.NO_DATA_FOUND);
            return { 
                status: false, 
                code:400,
                message: MESSAGE.NO_DATA_FOUND 
            };
        }
        data = await get_data(request);
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
const get_count = async (request) => {
    let userInfo = await autheticatedUserInfo(request)
    let count = 0;
    let data = [];
    
    let query = `select count(t.oid) from  ${TABLE.TICKET} as t left join ${ TABLE.TICKET_INVOICE } as ti on ti.oid = t.ticketInvoiceOid left join ${ TABLE.CUSTOMER } as c on c.oid = ti.customerOid left join  ${ TABLE.SUPPLIER } as s on s.oid = ti.supplierOid where t.status = 'Re-Issue' or t.customerStatusChange = 'true' or t.vendorStatusChange = 'true' and ti.companyOid = $1`;

    data.push(userInfo.companyoid);
    let idx = 2;
    if(request.query["invoiceNo"]){
        query += ` and ti.invoiceNo ilike ${idx++}`;
        data.push(`%${ request.query["invoiceNo"] }%`)
    }
    if (request.query["searchText"]) {
        query += ` and ti.invoiceNo ilike ${idx} or 
            c.name ilike ${idx} or t.ticketNo ilike ${idx} or 
            t.pnr ilike ${idx}`;
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
        log.error(err)
        throw new Error(err);
    }
    return count;
}
const get_data = async (request) => {
    const userInfo = await autheticatedUserInfo(request);
    let list_data = [];
    let data = [];
    let query = `select t.oid, ti.createdOn as "create_on", ti.editedOn as "edited_on", ti.source, ti.invoiceNo as "invoice_no", to_char(ti.invoiceDate, 'YYYY-MM-DD') as "invoice_date", to_char(ti.invoiceDate :: DATE, 'dd-Mon-yyyy') as "invoice_date_en", ti.invoiceCloneOid as "invoice_clone_oid", ti.customerOid as "customer_oid", ti.supplierOid as "supplier_oid" , t.ticketNo as "ticket_no" , to_char(t.issueDate, 'YYYY-MM-DD') as "issue_date", to_char(t.issueDate :: DATE, 'dd-Mon-yyyy') as "issue_date_en",  t.airlines, t.sector, t.pnr, t.paxName as "pax_name" , t.status, t.customerStatusChange as "customer_status_change", t.vendorStatusChange as "vendor_status_change", t.salesPrice as "sales_price", t.netSalesPrice as "net_sales_price", t.purchasePrice as "purchase_price", t.netPurchasePrice as "net_purchase_price", t.cloneOid as "clone_oid", t.ticketCloneOid as "ticket_clone_oid", t.ticketInvoiceOid as "ticket_invoice_oid", c.name as "customer_name", s.name as "supplier_name" from ${ TABLE.TICKET } as t left join ${ TABLE.TICKET_INVOICE } as ti on ti.oid = t.ticketInvoiceOid left join ${ TABLE.CUSTOMER } as c on c.oid = ti.customerOid left join ${ TABLE.SUPPLIER } as s on s.oid = ti.supplierOid where t.status = 'Re-Issue' or t.customerStatusChange = 'true'  or t.vendorStatusChange = 'true' and ti.companyOid = $1`;

    data.push(userInfo.companyoid);
    let idx = 2;
    if(request.query["invoiceNo"]){
        query += ` and ti.invoiceNo ilike ${idx++}`;
        data.push(`%${ request.query["invoiceNo"] }%`)
    }
    if (request.query["searchText"]) {
        query += ` and ti.invoiceNo ilike ${idx} or 
            c.name ilike ${idx} or t.ticketNo ilike ${idx} or 
            t.pnr ilike ${idx}`;
        data.push(`% ${request.query["searchText"].trim()} %`)
    }
    query += `order by p.createdOn desc`;

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
 