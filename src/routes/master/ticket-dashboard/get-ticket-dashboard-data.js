"use strict"

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const query_scheme = Joi.object({
    fromDate: Joi.date().required(),
    toDate: Joi.date().required(),
    // from: Joi.string().optional()
    from: Joi.string().trim().optional()
});

const route_controller = {
    method: "GET",
    path: API.CONTEXT + API.TICKET_DASHBOARD_GET_DASHBOARD_INFO_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "get ticket dashboard data",
        plugins: { hapiAuthorization: false },
        validate: {
            query: query_scheme,
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
        let userInfo = await autheticatedUserInfo(request)

        let from = new Date(request.query["fromDate"]);
        from.setDate( from.getDate() + 1 )

        let to = new Date(`${request.query["toDate"]}`);
        to.setDate( to.getDate() + 1 )

        request.query.fromDate = from.toISOString().slice(0,10);
        request.query.toDate = to.toISOString().slice(0,10)
        
        const data = await getData(userInfo, request);
        
        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_LIST,

        };
    } catch (err) {
        log.error(err?.message);
    }
}
const getData = async (userInfo, request) => {
    try {

        const total_sales_ticket_count = await getSalesTicketCount(user, request);
        const total_ticket_sales_amount = await getTicketSalesAmount(user, request);
        const total_ticket_received_amount = await getReceivedAmount(user, request);
        const total_ticket_bill_amount = await getTicketBillAmount(user, request);
        const total_ticket_bill_paid_amount = await getBillPaidAmount(user, request);
        const total_ticket_vendor_payment_amount = await getVendorPaymentAmount(user, request);
        const segment = await getSegment(user, request);

        const data_list = {
            total_sales_ticket_count,
            total_ticket_sales_amount,
            total_ticket_received_amount,
            total_ticket_due_amount: ( total_ticket_sales_amount - total_ticket_received_amount ),
            total_ticket_bill_amount,
            total_ticket_bill_paid_amount,
            total_ticket_payable_amount: ( total_ticket_bill_amount - total_ticket_bill_paid_amount),
            total_ticket_vendor_payment_amount,
            total_ticket_profit_amount: ( total_ticket_sales_amount - total_ticket_bill_amount),
            total_ticket_segment: segment,

        }

    } catch(err) {
        log.error(`an error in get ticket dashboard data ${ err }`)
    }
}
const getTicketSalesAmount = async (userInfo, request) => {
    let list_data = [];
    let data = [];
    console.log(request.query)
    let query = `select coalesce(sum(netsalesprice), 0) from ${ TABLE.TICKET_INVOICE }
        where 1 = 1 and companyOid = $1 and status = $2 and invoiceDate between 
        '${ request.query['fromDate'] }' and
        '${ request.query['toDate'] }' `;

    data.push(userInfo.companyoid, CONSTANT.ACTIVE);
    let sql = {
        text: query,
        values: data
    }
    try{
        list_data = await Dao.get_data(request.pg, sql);

    }
    catch(err) {
        log.error(`An exception occurred while getting sales amount : ${err}`)
        // throw new Error(e);
        
    }
    return list_data;
}
const getReceivedAmount = async (userInfo, request) => {
    let list_data = [];
    let data = [];

    let query = `select coalesce(sum(ibp.amount), 0) from ${ TABLE.TICKET_INVOICE } as ti 
        ${ TABLE.INVOICE_BILL_PAYMENT } as ibp, ${ TABLE.PAYMENT } as p 
        where 1 = 1 and ti.oid = ibp.refInvoiceOid and ibp.paymentOid = p.oid 
        and ti.companyOid = $1 and p.referenceType = $2 
        and ti.invoiceDate between '${ request.query['fromDate'] }' and
        '${ request.query['toDate'] }' `;

    data.push(userInfo.companyoid, CONSTANT.CUSTOMER);
    let sql = {
        text: query,
        values: data
    }
    try{
        list_data = await Dao.get_data(request.pg, sql);

    }
    catch(err) {
        log.error(`An exception occurred while getting received amount : ${ MESSAGE?.err}`)
        // throw new Error(e);
        
    }
    return list_data;
}

const getTicketBillAmount = async (userInfo, request) => {
    let list_data = [];
    let data = [];

    let query = `select coalesce(sum(purchasePrice), 0)
        from ${ TABLE.TICKET_INVOICE }
        where 1 = 1 and companyOid = $1 and status = $2 
        and invoiceDate between '${ request.query['fromDate'] }' and
        '${ request.query['toDate'] }' `;

    data.push(userInfo.companyoid, CONSTANT.ACTIVE);
    let sql = {
        text: query,
        values: data
    }
    try{
        list_data = await Dao.get_data(request.pg, sql);

    }
    catch(err) {
        log.error(`An exception occurred while getting ticket bill amount : ${err}`)
        // throw new Error(e);
        
    }
    return list_data;
}

const getBillPaidAmount = async (userInfo, request) => {
    let list_data = [];
    let data = [];

    let query = `select coalesce(sum(ibp.amount), 0)
        from ${ TABLE.TICKET_INVOICE } as ti, ${ TABLE.INVOICE_BILL_PAYMENT } as ibp, 
        ${ TABLE.PAYMENT } as p where 1 = 1 and ti.oid = ibp.refInvoiceOid and 
        ibp.paymentOid = p.oid and ti.companyOid = $1 and p.referenceType = $2 and 
        ti.invoiceDate between '${ request.query['fromDate'] }' 
        and '${ request.query['toDate'] }' `;

    data.push(userInfo.companyoid, CONSTANT.SUPPLIER);
    let sql = {
        text: query,
        values: data
    }
    try{
        list_data = await Dao.get_data(request.pg, sql);

    }
    catch(err) {
        log.error(`An exception occurred while getting bill paid amount : ${err}`)
        // throw new Error(e);
        
    }
    return list_data;
}
const getSalesTicketCount = async (userInfo, request) => {
    let list_data = [];
    let data = [];

    let query = `select coalesce(count(t.oid), 0) from ${ TABLE.TICKET_INVOICE } as ti,
        ${ TABLE.TICKET } as t where 1 = 1 and ti.oid = t.ticketInvoiceOid and 
        ti.companyOid = $1 and ti.status = $2 and ti.invoiceDate between 
        '${ request.query['fromDate'] }' and '${ request.query['toDate'] }' `;

    data.push(userInfo.companyoid, CONSTANT.ACTIVE);
    let sql = {
        text: query,
        values: data
    }
    try{
        list_data = await Dao.get_data(request.pg, sql);

    }
    catch(err) {
        log.error(err)
        // throw new Error(e);
        
    }
    return list_data;
}
const getSegment = async (userInfo, request) => {
    let list_data = [];
    let data = [];
    
    let query = `select coalesce(count(*), 0) from ${ TABLE.ROUTE }
    where 1 = 1 and companyOid = $1 `;
    
    data.push(userInfo.companyoid);
    let sql = {
        text: query,
        values: data
    }
    try{
        list_data = await Dao.get_data(request.pg, sql);
        
    }
    catch(err) {
        log.error(`An exception occurred while getting segment : ${err}`)
        // throw new Error(e);
        
    }
    return list_data;
}
const getVendorPaymentAmount = async (userInfo, request) => {
    let list_data = [];
    let data = [];

    let query = `select coalesce(sum(purchaseprice), 0) from ${ TABLE.TICKET_INVOICE } 
        where 1 = 1 and companyOid = $1 and invoiceDate between  
        '${ request.query['fromDate'] }' and '${ request.query['toDate'] }' `;

    data.push(userInfo.companyoid, CONSTANT.ACTIVE);
    let sql = {
        text: query,
        values: data
    }
    try{
        list_data = await Dao.get_data(request.pg, sql);

    }
    catch(err) {
        log.error(`An exception occurred while getting vendor payment amount : ${err}`)
        // throw new Error(e);
        
    }
    return list_data;
}
module.exports = route_controller;