"use strict";

const Joi = require("@hapi/joi");
const uuid = require('uuid');
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo, passwordGenerator } = require("../../../util/helper");

const payload_scheme = Joi.object({
    oid: Joi.string().trim().min(1).required(),

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
    path: API.CONTEXT + API.INVOICE_MISCELLANEOUSES_UPDATE_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "update miscelleaneouses",
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
    let update_data_return;
    try {
        update_data_return = await update_data(request);
        if (update_data_return.status) {
            log.info(`Successfully saved`);
            return { status: true, code: 200, message: MESSAGE.SUCCESS_UPDATE };
        }
        return { status: false, code: 409, message: update_data_return.message };
    } catch (err) {
        log.error(`An exception occurred while saving: ${err}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const update_data = async (request) => {
    try {
        const userInfo = await autheticatedUserInfo(request);
        request.payload.userInfo = userInfo;
        if (request.payload.invoice_for_whom.toLowerCase() === CONSTANT.CUSTOMER.toLowerCase()) {
            const executed = await updateCustomerMiscellaneousesInvoice(request)
            if (executed) {
                return {
                    message: "Success",
                    status: true
                }
            }
            return {
                message: "Problem in updating customer miscellaneouses",
                status: false
            }
        } else if (request.payload.invoice_for_whom.toLowerCase() === CONSTANT.SUPPLIER) {
            const executed = await updateSupplierMiscellaneousesInvoice(request)
            if (executed) {
                return {
                    message: "Success",
                    status: true
                }
            }
            return {
                message: "Problem in updating supplier miscellaneouses",
                status: false
            }
        } else if (request.payload.invoice_for_whom.toLowerCase() === CONSTANT.BOTH.toLowerCase()) {
            const executed = await updateCustomerSupplierMiscellaneousesInvoice(request)
            if (executed) {
                return {
                    message: "Success",
                    status: true
                }
            }
            return {
                message: "Problem in updating customer and supplier miscellaneouses",
                status: false
            }
        }

    } catch (error) {
        throw error;
    }

};


const updateCustomerMiscellaneousesInvoice = async (request) => {
    const { oid, sales_price, discount_amount, net_sales_price, receivable_amount, profit_amount, status, life_cycle, invoice_date, customer_oid, remarks, userInfo } = request.payload;
    let executed;
    let idx = 1;
    let cols = [`salesPrice = $${idx++}, discountAmount = $${idx++},
			netSalesPrice = $${idx++}, receivableAmount = $${idx++}, profitAmount = $${idx++},
			status = $${idx++}, lifeCycle = $${idx++}, editedBy = $${idx++}, editedOn = now()`];
    let data = [sales_price, discount_amount, net_sales_price, receivable_amount, profit_amount, status, life_cycle, userInfo.loginid]


    if (invoice_date) {
        cols.push(`invoiceDate = $${idx++}`);
        data.push(new Date(invoice_date).toISOString().slice(0, 10));
    }

    if (customer_oid) {
        cols.push(`customerOid = $${idx++}`);
        data.push(customer_oid);
    }

    if (remarks) {
        cols.push(`remarks = $${idx++}`);
        data.push(remarks);
    }


    let scols = cols.join(', ')
    let query = `update ${TABLE.TICKET_INVOICE} set ${scols} where 1 = 1 and oid = $${idx++}`;
    data.push(oid);
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




const updateSupplierMiscellaneousesInvoice = async (request) => {
    const { oid, purchase_price, commission_value, total_commission, profit_amount, status, life_cycle, userInfo, remarks, invoice_date, supplier_oid } = request.payload;
    let executed;
    let idx = 1;
    let cols = [`purchasePrice = $${idx++}, commissionValue = $${idx++}, totalCommission = $${idx++},
    netPurchasePrice = $${idx++}, payableAmount = $${idx++}, profitAmount = $${idx++},
    status = $${idx++}, lifeCycle = $${idx++}, editedBy = $${idx++}, editedOn = now()`];

    let data = [purchase_price, commission_value, total_commission, net_purchase_price, payable_amount, profit_amount, status, life_cycle, userInfo.loginid]


    if (invoice_date) {
        cols.push(`invoiceDate = $${idx++}`);
        data.push(new Date(invoice_date).toISOString().slice(0, 10));
    }

    if (supplier_oid) {
        cols.push(`supplierOid = $${idx++}`);
        data.push(supplier_oid);
    }


    if (remarks) {
        cols.push(`remarks = $${idx++}`);
        data.push(remarks);
    }


    let scols = cols.join(', ')
    let query = `update ${TABLE.TICKET_INVOICE} set ${scols} where 1 = 1 and oid = $${idx++}`;
    data.push(oid);
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

const updateCustomerSupplierMiscellaneousesInvoice = async (request) => {
    const { oid, sales_price, discount_amount, net_sales_price, receivable_amount, purchase_price, commission_value, total_commission, net_purchase_price, payable_amount, profit_amount, status, life_cycle, userInfo, invoice_date, customer_oid, supplier_oid, remarks } = request.payload;
    let executed;
    let idx = 1;
    let cols = [`salesPrice = $${idx++}, discountAmount = $${idx++},
    netSalesPrice = $${idx++}, receivableAmount = $${idx++}, purchasePrice = $${idx++}, commissionValue = $${idx++}, totalCommission = $${idx++},
    netPurchasePrice = $${idx++}, payableAmount = $${idx++}, profitAmount = $${idx++},
    status = $${idx++}, lifeCycle = $${idx++}, editedBy = $${idx++}, editedOn = now()`];

    let data = [sales_price, discount_amount, net_sales_price, receivable_amount, purchase_price, commission_value, total_commission, net_purchase_price, payable_amount, profit_amount, status, life_cycle, userInfo.loginid]


    if (invoice_date) {
        cols.push(`invoiceDate = $${idx++}`);
        data.push(new Date(invoice_date).toISOString().slice(0, 10));
    }

    if (supplier_oid) {
        cols.push(`supplierOid = $${idx++}`);
        data.push(supplier_oid);
    }

    if (customer_oid) {
        cols.push(`customerOid = $${idx++}`);
        data.push(customer_oid);
    }

    if (remarks) {
        cols.push(`remarks = $${idx++}`);
        data.push(remarks);
    }


    let scols = cols.join(', ')
    let query = `update ${TABLE.TICKET_INVOICE} set ${scols} where 1 = 1 and oid = $${idx++}`;
    data.push(oid);
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
