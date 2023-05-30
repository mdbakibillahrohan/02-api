"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, TABLE, MESSAGE, CONSTANT } = require("../../../util/constant");
const uuid = require('uuid');
const { autheticatedUserInfo } = require("../../../util/helper");

const payload_scheme = Joi.object({
    oid: Joi.string().trim().min(1).max(128).required(),
    re_issue_invoice_oid: Joi.string().trim().min(1).max(128).required(),
    invoice_no: Joi.number().required(),
    re_issue_invoice_no: Joi.number().required(),
    email_subject: Joi.string().trim().min(1).max(128).required(),
    customer_oid: Joi.string().trim().min(1).max(128).required(),
    supplier_oid: Joi.string().trim().min(1).max(128).required(),
    company_oid: Joi.string().trim().min(1).max(128).required(),
    status: Joi.string().trim().min(1).max(128).required(),
    life_cycle: Joi.string().trim().min(1).max(128).required(),
    pnr: Joi.string().trim().min(1).max(128).required(),
    airlines: Joi.string().trim().min(1).max(128).required(),
    remarks: Joi.string().trim().min(1).max(128).required(),
    tax_type: Joi.string().trim().min(1).max(128).required(),
    commission_type: Joi.string().trim().min(1).max(128).required(),
    payment_adjustment: Joi.string().trim().min(1).max(128).required(),
    invoice_payment_nature: Joi.string().trim().min(1).max(128).required(),
    invoice_adjustment: Joi.string().trim().min(1).max(128).required(),
    invoice_payment_type: Joi.string().trim().min(1).max(128).required(),
    invoice_account_oid: Joi.string().trim().min(1).max(128).required(),
    bill_payment_nature: Joi.string().trim().min(1).max(128).required(),
    bill_adjustment: Joi.string().trim().min(1).max(128).required(),
    bill_payment_type: Joi.string().trim().min(1).max(128).required(),
    bill_account_oid: Joi.string().trim().min(1).max(128).required(),
    payment_no: Joi.string().trim().min(1).max(128).required(),
    check_no: Joi.string().trim().min(1).max(128).required(),
    payment_type: Joi.string().trim().min(1).max(128).required(),
    image_path: Joi.string().trim().min(1).max(128).required(),
    reference_type: Joi.string().trim().min(1).max(128).required(),
    reference_oid: Joi.string().trim().min(1).max(128).required(),
    account_oid: Joi.string().trim().min(1).max(128).required(),
    description: Joi.string().trim().min(1).max(128).optional(),
    payment_nature: Joi.string().trim().min(1).max(128).optional(),
    account_holder_name: Joi.string().trim().min(1).max(128).optional(),
    bank_account_no: Joi.string().trim().min(1).max(128).required(),
    bank_name: Joi.string().trim().min(1).max(128).required(),
    branch_name: Joi.string().trim().min(1).max(128).required(),
    payment_mode: Joi.string().trim().min(1).max(128).required(),
    reference_by: Joi.string().trim().min(1).max(128).required(),
    reference_by_mobile_no: Joi.string().trim().min(1).max(128).required(),
    invoice_payment_oid: Joi.string().trim().min(1).max(128).required(),
    bill_payment_oid: Joi.string().trim().min(1).max(128).required(),
    invoice_detail_payment_oid: Joi.string().trim().min(1).max(128).required(),
    bill_detail_payment_oid: Joi.string().trim().min(1).max(128).required(),

    tax_amount: Joi.number().required(),
    service_charge: Joi.number().required(),
    total_service_charge: Joi.number().required(),
    company_service_charge: Joi.number().required(),
    total_company_service_charge: Joi.number().required(),
    commission_value: Joi.number().required(),
    commission_amount: Joi.number().required(),
    total_commission: Joi.number().required(),
    total_ext_commission: Joi.number().required(),
    purchase_price: Joi.number().required(),
    sales_price: Joi.number().required(),
    customer_actual_panalty_amount: Joi.number().required(),
    customer_panalty_amount: Joi.number().required(),
    customer_refund_amount: Joi.number().required(),
    vendor_actual_panalty_amount: Joi.number().required(),
    vendor_panalty_amount: Joi.number().required(),
    vendor_refund_amount: Joi.number().required(),
    payable_amount: Joi.number().required(),
    receivable_amount: Joi.number().required(),
    profit_amount: Joi.number().required(),
    previous_payable_amount: Joi.number().required(),
    previous_receivable_amount: Joi.number().required(),
    previous_net_purchase_price: Joi.number().required(),
    previous_net_sales_price: Joi.number().required(),
    previous_profit_amount: Joi.number().required(),
    previous_customer_panalty_amount: Joi.number().required(),
    previous_customer_refund_amount: Joi.number().required(),
    previous_vendor_panalty_amount: Joi.number().required(),
    previous_vendor_refund_amount: Joi.number().required(),
    net_purchase_price: Joi.number().required(),
    net_sales_price: Joi.number().required(),
    discount_amount: Joi.number().required(),
    incentive_amount: Joi.number().required(),
    invoice_payable_amount: Joi.number().required(),
    bill_receivable_amount: Joi.number().required(),
    amount: Joi.number().required(),
    customer_adc_amount: Joi.number().required(),
    vendor_adc_amount: Joi.number().required(),

    re_issue_payable_amount: Joi.number().required(),
    re_issue_receivable_amount: Joi.number().required(),
    re_issue_profit_amount: Joi.number().required(),
    reIssue_sales_price: Joi.number().required(),
    reIssue_net_sales_price: Joi.number().required(),
    re_issue_purchase_price: Joi.number().required(),
    reIssue_net_purchase_price: Joi.number().required(),

    customer_additional_service_amount: Joi.number().required(),
    vendor_additional_service_amount: Joi.number().required(),
    re_issue_vendor_additional_service_amount: Joi.number().required(),
    re_issue_customer_additional_service_amount: Joi.number().required(),
    void_refund_list_length: Joi.number().required(),

    invoice_date: Joi.date().optional(),
    invoice_payment_date: Joi.date().optional(),
    bill_payment_date: Joi.date().optional(),
    cheque_issue_date: Joi.date().optional(),

    // flight_number: Joi.number().required(),
    // visa_number: Joi.number().required(),
    // visa_type: Joi.string().trim().min(1).max(64).required(),
    // departure_date: Joi.date().optional(),
    // birth_date: Joi.date().optional(),
    // passport_expiry_date: Joi.date().optional(),
    // visa_expiry_date: Joi.date().optional(),
    // gender: Joi.string().trim().valid('male', 'female','transger', 'others').optional(),
    // nationality: Joi.string().trim().min(1).max(64).optional(),
    // address_for_foreigners: Joi.string().trim().min(1).optional(),
    // purpose_of_visit: Joi.string().trim().min(1).optional(),

    ticket_list: Joi.array().items({
        oid: Joi.string().trim().min(1).max(128).required(),
        ticket_invoice_oid: Joi.string().trim().min(1).max(128).required(),

        route_list: Joi.array().items({
            oid: Joi.string().trim().min(1).max(128).required(),
            departure: Joi.string().trim().min(1).max(128).required(),
            arrival: Joi.string().trim().min(1).max(128).required(),
            flight_no: Joi.string().trim().min(1).max(128).required(),
            bag: Joi.string().trim().min(1).max(128).required(),
            ticket_class: Joi.string().trim().min(1).max(128).required(),
            ticket_class_type: Joi.string().trim().min(1).max(128).required(),
            ticket_invoice_oid: Joi.string().trim().min(1).max(128).required(),
            ticket_oid: Joi.string().trim().min(1).max(128).required(),
            additional_service: Joi.string().trim().min(1).max(128).required(),
            customer_additional_service_amount: Joi.number().required(),
            vendor_additional_service_amount: Joi.number().required(),
            reIssue_vendor_additional_service_amount: Joi.number().required(),
            reIssue_customer_additional_service_amount: Joi.number().required(),
            departure_date_time: Joi.date().required(),
            arrival_date_time: Joi.date().required(),

        }),
        tax_list: Joi.array().items({
            tax_code: Joi.string().trim().min(1).max(64).required(),
            ticket_oid: Joi.string().trim().min(1).max(128).required(),
            ticket_invoice_oid: Joi.string().trim().min(1).max(128).required(),
            tax_amount: Joi.number().optional(),
        })
    }),    
    re_issue_ticket_list: Joi.array().items({
        
    }),
});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.TICKET_MODIFICATION_SAVE_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "save",
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
        log.info(`Request received - ${JSON.stringify(request.payload)}`);
        const response = await handle_request(request);
        log.debug(`Response sent - ${JSON.stringify(response)}`);
        return h.response(response);
    },
};

const handle_request = async (request) => {
    try {
        const userInfo = await autheticatedUserInfo(request);
        const oid = uuid.v4();
        const save = await save_data(userInfo, oid, request);
        const update_ticket = await updateTicket(userInfo, oid, request);

        if(save["rowCount"] == 1 && update_ticket["rowCount"]==1){      
            log.info(`Successfully saved`);
            return { status: true, code: 200, message: MESSAGE.SUCCESS_SAVE }; 
        }
        
        log.info(MESSAGE.INTERNAL_SERVER_ERROR);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    } catch (err) {
        log.error(`An exception occurred while saving: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const updateTicketInvoice = async (userInfo, oid, request) => {
    let cols = [ ];

    let params = ['$1', '$2', '$3', '$4', '$5', '$6', '$7', '$8', "$9"];

    let data = [oid, request.payload["passenger_name"], request.payload["passport_number"], request.payload["flight_number"], request.payload["visa_number"], request.payload["visa_type"], userInfo.loginid, 'now()', userInfo.companyoid];

    let idx = 10;
    if (request.payload["departure_date"]) {
        cols.push("departureDate");
        params.push(`$${idx++}`);
        data.push(request.payload["departure_date"]);
    }
    if (request.payload["birth_date"]) {
        cols.push("birthDate");
        params.push(`$${idx++}`);
        data.push(request.payload["birth_date"]);
    }
    if (request.payload["passport_expiry_date"]) {
        cols.push("passportExpiryDate");
        params.push(`$${idx++}`);
        data.push(request.payload["passport_expiry_date"]);
    }
    if (request.payload["visa_expiry_date"]) {
        cols.push("visaExpiryDate");
        params.push(`$${idx++}`);
        data.push(request.payload["visa_expiry_date"]);
    }
    if (request.payload["gender"]) {
        cols.push("gender");
        params.push(`$${idx++}`);
        data.push(request.payload["gender"]);
    }
    if (request.payload["nationality"]) {
        cols.push("nationality");
        params.push(`$${idx++}`);
        data.push(request.payload["nationality"]);
    }
    if (request.payload["address_for_foreigners"]) {
        cols.push("addressForForeigners");
        params.push(`$${idx++}`);
        data.push(request.payload["address_for_foreigners"]);
    }
    if (request.payload["purpose_of_visit"]) {
        cols.push("purposeOfVisit");
        params.push(`$${idx++}`);
        data.push(request.payload["purpose_of_visit"]);
    }

    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.DEPARTURE_CARD} (${scols}) values (${sparams})`;
    let sql = {
        text: query,
        values: data
    }
    try {
        return await Dao.execute_value(request.pg, sql);
    } 
    catch (err) {
        log.error(`An exception occurred while saving: ${err} `)
    }
};

const updateTicket = async (userInfo, oid, request) => {

    let cols = [ "departureCardOid = $1"];

    let data = [oid];
    

    let scols = cols.join(', ')

    let query = `update ${ TABLE.TICKET } set ${scols} where 1 = 1 and oid = $2`;
    data.push(request.payload.ticket_oid)

    let sql = {
        text: query,
        values: data
    }
    try{
        return await Dao.execute_value(request.pg, sql)
    } 
    catch(err) {
        log.error(`An exception occurred while updating: ${err?.message}`)
    }
}


module.exports = save_controller;
