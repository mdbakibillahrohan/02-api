"use strict"

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const payload_scheme = Joi.object({
    ticket_clone_oid: Joi.string().trim().min(1).max(128).required()
});

const route_controller = {
    method: "POST",
    path: API.CONTEXT + API.TICKET_MODIFICATION_REISSUE_TICKET_LIST_BY_TICKETOID_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "ticket list by tickeoid",
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
    
    let query = `select count(t.oid) from ${ TABLE.TICKET } as t 
        left join ${ TABLE.TICKET_INVOICE } as ti on ti.oid = t.ticketinvoiceoid 
        where 1 = 1 and t.ticketcloneoid = $1 and ti.companyOid = $2`;

    data.push(request.payload.ticket_clone_oid, userInfo.companyoid);
    let idx = 3;
    if(request.payload["source"]){
        query += ` and ti.source =  ${idx++}`;
        data.push(`${ request.payload["source"] }`)
    }
    if (request.payload["invoiceNo"]) {
        query += ` and ti.invoiceNo ilike ${idx++} `;
        data.push(`% ${request.payload["invoiceNo"].trim()} %`)
    }
    if (request.payload["searchText"]) {
        query += ` and ti.invoiceNo ilike ${idx} or 
            t.ticketNo ilike ${idx++} `;
        data.push(`% ${request.payload["searchText"].trim()} %`)
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
    let query = `select ti.invoiceNo as invoice_no, to_char(ti.invoiceDate, 'YYYY-MM-DD') as invoice_date, to_char(ti.invoiceDate :: DATE, 'dd-Mon-yyyy') as invoice_date_en, ti.source, ti.lifeCycle as life_cycle, t.oid, t.ticketNo as ticket_no, t.issueDate as issue_date, t.airlines, t.sector, t.pnr, t.paxName as pax_name, t.ticketType ticket_type, t.passengerType as passenger_type, t.purchasePrice as purchase_price, t.netPurchasePrice as net_purchase_price, t.salesPrice as sales_price, t.netSalesPrice as net_sales_price, t.customerAdditionalServiceAmount as customer_additional_service_amount, t.customerAdcAmount as customer_adc_amount, t.vendorAdditionalServiceAmount as vendor_additional_service_amount, t.vendorAdcAmount as vendor_adc_amount, t.payableAmount as payable_amount, t.receivableAmount as receivable_amount, t.profitAmount as profit_amount, t.status, t.customerStatusChange as customer_status_change, t.vendorStatusChange as vendor_status_change, t.cloneOid as clone_oid, t.ticketCloneOid as ticket_clone_oid, t.passportOid as passport_oid, t.ticketInvoiceOid as ticket_invoice_oid from ${ TABLE.TICKET } as t left join ${ TABLE.TICKET_INVOICE } as ti on ti.oid = t.ticketInvoiceOid where 1 = 1 and t.ticketcloneoid = $1 and ti.companyOid = $2`;

    data.push(request.payload.ticket_clone_oid, userInfo.companyoid);
    let idx = 3;

    if(request.payload["source"]){
        query += ` and ti.source =  ${idx++}`;
        data.push(`${ request.payload["source"] }`)
    }
    if (request.payload["invoiceNo"]) {
        query += ` and ti.invoiceNo ilike ${idx++} `;
        data.push(`% ${request.payload["invoiceNo"].trim()} %`)
    }
    if (request.payload["searchText"]) {
        query += ` and ti.invoiceNo ilike ${idx} or 
            t.ticketNo ilike ${idx++} `;
        data.push(`% ${request.payload["searchText"].trim()} %`)
    }

    query += ` order by ti.invoiceDate desc`;

    if (request.payload.offset) {
        query += ` offset $${idx++}`;
        data.push(request.payload.offset);
    }
    if (request.payload.limit) {
        query += ` limit $${idx++}`;
        data.push(request.ppayloadyload.limit)
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
 