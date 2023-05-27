"use strict"

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE } = require("../../../util/constant");
// const { autheticatedUserInfo } = require("../../../util/helper");

const query_scheme = Joi.object({
    oid: Joi.string().trim().min(1).max(128).required(),

});

const route_controller = {
    method: "GET",
    path: API.CONTEXT + API.INVOICE_MISCELLANEOUSES_GET_BY_OID_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "get passport by oid",
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
        const userInfo = await autheticatedUserInfo(request);
        let body, ticketList;
        try {
            body = await getMiscellaneousesInvoice(userInfo, request);
            ticketList = await getMiscellaneousesDetailByOid(userInfo, request);
            log.info(`Get Miscellaneouses Invoice informaiton - {}, ${body.customer_name}`);
        } catch (err) {
            log.error(`An exception occurred  : ${err}`)
            return {
                status: false,
                code: 500,
                message: MESSAGE.INTERNAL_SERVER_ERROR
            };

        }

        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_BY_OID,
            body: body.length() == 0 ? MESSAGE.NO_DATA_FOUND : body,
            ticketList: ticketList.length() == 0 ? MESSAGE.NO_DATA_FOUND : ticketList

        };
    } catch (err) {
        log.error(`An exception occurred while getting Miscellaneouses Invoice information by oid : ${err}`);
    }
}
const getMiscellaneousesInvoice = async (userInfo, request) => {
    let list_data = [];
    let data = [];
    let query = `select ti.oid, ti.source, ti.invoiceForWhom as invoice_for_whom, 
        ti.invoiceNo as invoice_no, to_char(ti.invoiceDate, 'YYYY-MM-DD') as invoice_date,
        ti.discountAmount as discount_amount, ti.salesPrice as sales_price, ti.salesPrice as previous_sales_price, ti.netSalesPrice as net_sales_price, ti.netSalesPrice as previous_net_sales_price, ti.receivableAmount as receivable_amount, ti.receivableAmount as previous_receivable_amount, ti.totalCommission as total_commission, ti.totalCommission as commission_amount, ti.purchasePrice as purchase_price, ti.purchasePrice as previous_purchase_price, ti.netPurchasePrice as net_purchase_price, ti.netPurchasePrice as previous_net_purchase_price, ti.payableAmount as payable_amount, ti.payableAmount as previous_payable_amount, ti.profitAmount as profit_amount, ti.profitAmount as previous_profit_amount, ti.remarks, ti.status, ti.lifeCycle as life_cycle, ti.customerOid as customer_oid, ti.supplierOid as supplier_oid, ticket_invoice_received_amount(ti.customeroid, ti.oid) as received_amount, ticket_invoice_paid_amount(ti.supplierOid, ti.oid) as paid_amount,
        c.name as customer_name, c.mobileNo as customer_mobile_no, c.email as customer_email, c.address as customer_address, s.name as supplier_name, s.mobileNo as supplier_mobile_no, s.email as supplier_email, s.address as supplier_address from ${TABLE.TICKET_INVOICE} as ti 
        left join ${TABLE.CUSTOMER} as c on ti.customerOid = c.oid 
        left join  ${TABLE.SUPPLIER} as s on ti.supplierOid = s.oid 
        where 1 = 1 and ti.oid = $1 `;

    data.push(request.query.oid);

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
const getMiscellaneousesDetailByOid = async (userInfo, request) => {
    let list_data = [];
    let data = [];
    let query = `select t.oid, t.issueDate as issue_date, t.discountType as discount_type,
        t.discountValue as discount_value, t.discountAmount as discount_amount, 
        t.salesPrice as sales_price, t.netSalesPrice as net_sales_price, 
        t.profitAmount as profit_amount, t.receivableAmount as receivable_amount, 
        t.commissionType as commission_type, t.commissionValue as commission_value, 
        t.commissionAmount as commission_amount, t.purchasePrice as purchase_price, 
        t.netPurchasePrice as net_purchase_price, t.payableAmount as payable_amount, 
        t.status, t.sortOrder as sort_order, t.remarks, t.cloneOid as clone_oid, 
        t.ticketInvoiceOid as ticket_invoice_oid from ${TABLE.TICKET} as t
        where 1 = 1 and t.ticketInvoiceOid = $1`;

    data.push(request.query.oid);
    query += ` order by t.sortOrder asc`;

    let sql = {
        text: query,
        values: data
    }
    try {
        list_data = await Dao.get_data(request.pg, sql);
    } catch (err) {
        log.error(`An exception occurred while getting Miscellaneouses Detail by ticketInvoiceOid : ${err}`)
        // throw new Error(e);
    }
    return list_data;
}
module.exports = route_controller;