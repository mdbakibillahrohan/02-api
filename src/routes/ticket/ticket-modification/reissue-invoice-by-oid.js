"use strict"

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const query_scheme = Joi.object({
    oid: Joi.string().trim().min(1).max(128).required()
});

const route_controller = {
    method: "GET",
    path: API.CONTEXT + API.TICKET_MODIFICATION_REISSUE_INVOICE_BY_OID_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "ticket departure card get by tickeoid",
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
        // let data = await get_data(request);
        let tax, route;
        let ticket_invoice = await getTicketInvoice(request);
        for (let i of ticket_invoice) {
            tax = await getTax(i);

            route = await getRoute(i);
        }

        log.info(`data found by oid`);
        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_BY_OID,
            // data,
            ticket_invoice,
            route,
            tax

        };
    } catch (err) {
        log.error(err);
    }
}
const getTicketInvoice = async (request) => {
    const userInfo = await autheticatedUserInfo(request);
    let list_data = [];
    let data = [];

    let query = `select ti.oid, ti.invoiceNo as "invoice_no", t2.invoiceNo as "old_invoice_no", to_char(ti.invoiceDate, 'YYYY-MM-DD') as "invoice_date", to_char(t2.invoiceDate, 'YYYY-MM-DD') as "old_invoice_date", ti.purchasePrice as "purchase_price", ti.netPurchasePrice as "net_purchase_price", ti.salesPrice as "sales_price", ti.netSalesPrice as "net_sales_price", ti.netPurchasePrice as "previous_net_purchase_price", ti.netSalesPrice as "previous_net_sales_price", ti.payableAmount as "payable_amount", ti.payableAmount as "previous_payable_amount", ti.receivableAmount as "receivable_amount", ti.receivableAmount as "previous_receivable_amount", ti.profitAmount as "profit_amount", ti.profitAmount as "previous_profit_amount", ti.vendorAdditionalServiceAmount as "vendor_additional_service_amount", ti.customerAdditionalServiceAmount as "customer_additional_service_amount", ti.vendorAdditionalServiceAmount as "re_issue_vendor_additional_service_amount",  ti.customerAdditionalServiceAmount as "reIssue_customer_additional_service_amount", ti.customerAdcAmount as "customer_adc_amount", ti.vendorAdcAmount as "vendor_adc_amount", ti.customerAdcAmount as "previous_customer_adc_amount", ti.vendorAdcAmount as "previous_vendor_adc_amount", ti.remarks, ti.status, ti.lifeCycle as "life_cycle", ti.customerOid as "customer_oid", ti.supplierOid as "supplier_oid", ti.invoiceCloneOid as "invoice_clone_oid", ticket_invoice_received_amount(ti.customeroid, ti.oid) as "received_amount", ticket_invoice_paid_amount(ti.supplierOid, ti.oid) as "paid_amount", c.name as "customer_name", c.mobileNo as "customer_mobile_no", c.email as "customer_email", c.address as "customer_address", s.name as "supplier_name", s.mobileNo as "supplier_mobile_no", s.email as "supplier_email", s.address as "supplier_address" from ${TABLE.TICKET_INVOICE} as ti  left join  ${TABLE.TICKET_INVOICE} as t2 on ti.invoiceCloneOid = t2.oid left join  ${TABLE.CUSTOMER} as  c on ti.customerOid = c.oid  left join  ${TABLE.SUPPLIER} s on ti.supplierOid = s.oid  where 1 = 1 and ti.oid = $1 and companyOid = $2`;

    data.push(request.query["oid"], userInfo.companyoid);

    let sql = {
        text: query,
        values: data
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql);
        list_data = data_set.length < 1 ? null : data_set[0];
    } catch (e) {
        log.error(`An exception occurred while getting data by oid: ${e}`);
    }
    return list_data;
}
const getRoute = async (ticketoid) => {
    const userInfo = await autheticatedUserInfo(request);
    let list_data = [];
    let data = [];

    let query = `select r.oid, r.flightNo as "flight_no", r.bag,  r.departure, r.arrival, to_char(r.departureDateTime, 'YYYY-MM-DD HH24:MI:SS') as "departure_date_time", to_char(r.arrivalDateTime, 'YYYY-MM-DD HH24:MI:SS') as "arrival_date_time", r.ticketClass as "ticket_class", r.ticketClassType as "ticket_class_type", r.durationInHour as "duration_in_hour", r.durationInMinute as "duration_in_minute",  r.additionalService as "additional_service", r.vendorAdditionalServiceAmount as "vendor_additional_service_amount", r.customerAdditionalServiceAmount as "customer_additional_service_amount", r.vendorAdditionalServiceAmount as "reIssue_vendor_additional_service_amount",r.customerAdditionalServiceAmount as "reIssue_customer_additional_service_amount", (vendorAdditionalServiceAmount+customerAdditionalServiceAmount) as "total_service_amount", r.sortOrder as "sort_order", r.ticketOid  as "ticket_oid" from ${TABLE.ROUTE} as r where 1 = 1 and r.ticketOid = $1`;

    data.push(ticketoid);
    query += ` order by r.sortOrder asc`;
    let sql = {
        text: query,
        values: data
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql);
        list_data = data_set.length < 1 ? null : data_set[0];
    } catch (e) {
        log.error(`An exception occurred while getting data by oid: ${e}`);
    }
    return list_data;
}

const getTax = async (ticketoid) => {
    const userInfo = await autheticatedUserInfo(request);
    let list_data = null;
    let data = [];

    let query = `select t.oid,  t.taxCode, t.taxAmount
			 from ${TABLE.TAX} as t where 1 = 1 and t.ticketOid = $1`;
    let sql = {
        text: query,
        values: [ticketoid]
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql);
        list_data = data_set.length < 1 ? null : data_set[0];
    } catch (e) {
        log.error(`An exception occurred while getting data by oid: ${e}`)
    }
    return list_data;
}

module.exports = route_controller;