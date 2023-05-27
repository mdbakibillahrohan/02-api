"use strict";

const Joi = require("@hapi/joi");
const uuid = require('uuid');
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const payload_scheme = Joi.object({
    invoice_for_whom: Joi.string().trim().min(1).max(15).required(),
    source: Joi.string().trim().min(1).max(32).required(),
    life_cycle: Joi.string().trim().min(1).max(32).required(),
    status: Joi.string().trim().min(5).max(7).required(),
    profit_amount: Joi.number().required(),
    remarks: Joi.string().trim().min(1).optional(),

    sales_price: Joi.number().optional(),
    discount_amount: Joi.number().optional(),
    net_sales_price: Joi.number().optional(),
    receivable_amount: Joi.number().optional(),
    invoice_date: Joi.date().optional(),
    customer_oid: Joi.string().trim().min(1).optional(),

    purchase_price: Joi.number().optional(),
    commission_type: Joi.string().trim().min(1).max(8).optional(),
    commission_value: Joi.number().optional(),
    total_commission: Joi.number().optional(),
    net_purchase_price: Joi.number().optional(),
    payable_amount: Joi.number().optional(),
    supplier_oid: Joi.string().trim().min(1).optional(),
});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.INVOICE_MISCELLANEOUSES_SAVE_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "save invoice miscellaneouses",
        plugins: { hapiAuthorization: false },
        validate: {
            payload: payload_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 301, status: false, message: err }).takeover();
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
    let save_data_return;
    try {
        save_data_return = await save_data(request);
        if (save_data_return.status) {
            log.info(`Successfully saved`);
            return { status: true, code: 200, message: MESSAGE.SUCCESS_SAVE };
        }
        return { status: false, code: 409, message: save_data_return.message };
    } catch (err) {
        log.error(`An exception occurred while saving invoice miscellaneouses: ${err}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const save_data = async (request) => {
    try {
        const userInfo = await autheticatedUserInfo(request);
        const date = new Date();
        const invoiceNo = date.getTime();
        request.payload.userInfo = userInfo;
        request.payload.invoice_no = invoiceNo;

        if (request.payload.invoice_for_whom.toLowerCase() === CONSTANT.CUSTOMER.toLowerCase()) {
            const save_query = await save_customer_miscellaneouses_invoice(request)
            if (save_query) {
                return {
                    status: true,
                    message: "Success"
                }
            }
            return {
                status: false,
                message: "Error in save customer miscellaneouses"
            }
        } else if (request.payload.invoice_for_whom.toLowerCase() === CONSTANT.SUPPLIER.toLowerCase()) {
            const save_query = await save_supplier_miscellaneouses_invoice(request)
            if (save_query) {
                return {
                    status: true,
                    message: "Success"
                }
            }
            return {
                status: false,
                message: "Error in save supplier miscellaneouses"
            }
        } else if (request.payload.invoice_for_whom.toLowerCase() === CONSTANT.BOTH.toLowerCase()) {
            const save_query = await save_customer_supplier_miscellaneouses_invoice(request);
            if (save_query) {
                return {
                    status: true,
                    message: "Success"
                }
            }
            return {
                status: false,
                message: "Error in save customer and supplier miscellaneouses"
            }
        }

    } catch (error) {
        throw error;
    }

};


const save_customer_miscellaneouses_invoice = async (request) => {
    const { invoice_for_whom, invoice_no, source, life_cycle, sales_price, discount_amount, net_sales_price, receivable_amount, profit_amount, status, userInfo, invoice_date, customer_oid, remarks } = request.payload;
    let executed;
    let cols = ["oid", "invoiceForWhom", "invoiceNo", "source", "lifeCycle",
        "salesPrice", "discountAmount", "netSalesPrice", "receivableAmount", "profitAmount",
        "status", "createdBy", "companyOid"];
    let params = ['$1', '$2', '$3', '$4', '$5', '$6', '$7', '$8', '$9', '$10', '$11', '$12', '$13'];
    let idx = 14;
    const id = uuid.v4()
    let data = [id, invoice_for_whom, invoice_no, source, life_cycle, sales_price, discount_amount, net_sales_price, receivable_amount, profit_amount, status, userInfo.loginid, userInfo.companyoid]


    if (invoice_date) {
        cols.push("invoiceDate");
        params.push(`$${idx++}`);
        data.push(new Date(invoice_date).toISOString().slice(0, 10));
    }
    if (customer_oid) {
        cols.push("customerOid");
        params.push(`$${idx++}`);
        data.push(customer_oid);
    }
    if (remarks) {
        cols.push("remarks");
        params.push(`$${idx++}`);
        data.push(remarks);
    }

    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.TICKET_INVOICE} (${scols}) values (${sparams})`;
    let sql = {
        text: query,
        values: data
    }
    try {
        executed = await Dao.execute_value(request.pg, sql);
    } catch (e) {
        throw new Error(e);
    }
    if (executed.rowCount > 0) {
        return true;
    }
    return false;
}

const save_supplier_miscellaneouses_invoice = async (request) => {
    const { invoice_for_whom, invoice_no, source, life_cycle, purchase_price, commission_type, commission_value, total_commission, net_purchase_price, payable_amount, profit_amount, userInfo, invoice_date, supplier_oid, remarks, status } = request.payload;
    let executed;
    let cols = ["oid", "invoiceForWhom", "invoiceNo", "source", "lifeCycle",
        "purchasePrice", "commissionType", "commissionValue", "totalCommission", "netPurchasePrice", "payableAmount", "profitAmount",
        "status", "createdBy", "companyOid"];
    let params = ['$1', '$2', '$3', '$4', '$5', '$6', '$7', '$8', '$9', '$10', '$11', '$12', '$13', '$14', '$15'];
    let idx = 16;
    const id = uuid.v4()
    let data = [id, invoice_for_whom, invoice_no, source, life_cycle, purchase_price, commission_type, commission_value, total_commission, net_purchase_price, payable_amount, profit_amount, status, userInfo.loginid, userInfo.companyoid]
    if (invoice_date) {
        cols.push("invoiceDate");
        params.push(`$${idx++}`);
        data.push(new Date(invoice_date).toISOString().slice(0, 10));
    }
    if (supplier_oid) {
        cols.push("supplierOid");
        params.push(`$${idx++}`);
        data.push(supplier_oid);
    }
    if (remarks) {
        cols.push("remarks");
        params.push(`$${idx++}`);
        data.push(remarks);
    }
    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.TICKET_INVOICE} (${scols}) values (${sparams})`;
    let sql = {
        text: query,
        values: data
    }
    try {
        executed = await Dao.execute_value(request.pg, sql);
    } catch (e) {
        throw new Error(e);
    }
    if (executed.rowCount > 0) {
        return true;
    }
    return false;
}



const save_customer_supplier_miscellaneouses_invoice = async (request) => {
    const { invoice_for_whom, invoice_no, source, life_cycle, purchase_price, commission_type, commission_value, total_commission, net_purchase_price, payable_amount, profit_amount, userInfo, invoice_date, customer_oid, remarks, supplier_oid, status, sales_price, discount_amount, net_sales_price, receivable_amount } = request.payload;
    let executed;
    let cols = ["oid", "invoiceForWhom", "invoiceNo", "source", "lifeCycle",
        "salesPrice", "discountAmount", "netSalesPrice", "receivableAmount",
        "purchasePrice", "commissionType", "commissionValue", "totalCommission", "netPurchasePrice", "payableAmount",
        "profitAmount", "status", "createdBy", "companyOid"];
    let params = ['$1', '$2', '$3', '$4', '$5', '$6', '$7', '$8', '$9', '$10', '$11', '$12', '$13', '$14', '$15', '$16', '$17', '$18', '$19'];
    let idx = 20;
    const id = uuid.v4()
    let data = [id, invoice_for_whom, invoice_no, source, life_cycle, sales_price, discount_amount, net_sales_price, receivable_amount, purchase_price, commission_type, commission_value, total_commission, net_purchase_price, payable_amount, profit_amount, status, userInfo.loginid, userInfo.companyoid]


    if (invoice_date) {
        cols.push("invoiceDate");
        params.push(`$${idx++}`);
        data.push(new Date(invoice_date).toISOString().slice(0, 10));
    }
    if (customer_oid) {
        cols.push("customerOid");
        params.push(`$${idx++}`);
        data.push(customer_oid);
    }
    if (supplier_oid) {
        cols.push("supplierOid");
        params.push(`$${idx++}`);
        data.push(supplier_oid);
    }
    if (remarks) {
        cols.push("remarks");
        params.push(`$${idx++}`);
        data.push(remarks);
    }

    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.TICKET_INVOICE} (${scols}) values (${sparams})`;
    let sql = {
        text: query,
        values: data
    }
    try {
        executed = await Dao.execute_value(request.pg, sql);
    } catch (e) {
        throw new Error(e);
    }
    if (executed.rowCount > 0) {
        return true;
    }
    return false;
}



module.exports = save_controller;
