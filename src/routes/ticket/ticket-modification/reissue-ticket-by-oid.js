"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, TABLE, MESSAGE } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const payload_scheme = Joi.object({
    ticket_clone_oid: Joi.string().trim().min(1).max(128).required(),
    clone_oid: Joi.string().trim().min(1).max(128).optional(),
});

const get_by_oid = {
    method: "POST",
    path: API.CONTEXT + API.TICKET_MODIFICATION_REISSUE_TICKET_BY_OID_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "get by oid",
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
        let data = await get_data(request);
        log.info(`data found by oid`);
        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_BY_OID,
            data: data
        };
    } catch (err) {
        log.error(err?.message);
    }
};

const get_data = async (request) => {
    const userInfo = await autheticatedUserInfo(request);

    let data = null, query = null;
    query = `select ti.invoiceNo as invoice_no, to_char(ti.invoiceDate, 'YYYY-MM-DD') 
        as invoice_date, to_char(ti.invoiceDate :: DATE, 'dd-Mon-yyyy') as invoice_date_en, ti.source, ti.lifeCycle as life_cycle, t.oid, t.ticketNo as ticket_no, t.issueDate as issue_date, t.airlines, t.sector, t.pnr, t.paxName as pax_name, t.ticketType as ticket_type, t.passengerType as passenger_type, t.purchasePrice as purchase_price, t.netPurchasePrice as net_purchase_price, t.salesPrice as sales_price, t.netSalesPrice as net_sales_price, t.customerAdditionalServiceAmount as customer_additional_service_amount, t.customerAdcAmount as customer_adc_amount, t.vendorAdditionalServiceAmount as vendor_additional_service_amount, t.vendorAdcAmount as vendor_adc_amount, t.payableAmount as payable_amount, t.receivableAmount as receivable_amount, t.profitAmount as profit_amount, t.status, t.customerStatusChange as customer_status_change, t.vendorStatusChange as vendor_status_change, t.cloneOid as clone_oid, t.ticketCloneOid as ticket_clone_oid, t.passportOid as passport_oid, t.ticketInvoiceOid ticket_invoice_oidfrom ${ TABLE.TICKET } as t left join ${ TABLE.TICKET_INVOICE } as ti on ti.oid = t.ticketInvoiceOid where 1 = 1 and ti.companyOid = $1`;

    let params = [userInfo.companyoid]
    let idx = 2;
    if(request.payload["ticket_clone_oid"]) {
        query += ` and t.ticketCloneOid = $${idx++}`;
        params.push(request.payload["ticket_clone_oid"]);
    }
    
    if(request.payload["clone_oid"]) {
        query += ` and t.cloneOid = $${idx++}`;
        params.push(request.payload["clone_oid"]);
    }
    let sql = {
        text: query,
        values: params
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql);
        data = data_set.length < 1 ? null : data_set[0];
    } catch (e) {
        log.error(`An exception occurred while getting data by oid: ${e?.message}`);
    }
    return data;
};

module.exports = get_by_oid;
