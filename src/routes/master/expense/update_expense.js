"use strict";

const Joi = require("@hapi/joi");
const uuid = require('uuid');
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const payload_scheme = Joi.object({
    oid: Joi.string().trim().min(1).required(),
    expense_by: Joi.string().trim().min(1).required(),
    status: Joi.string().valid("Active", "Inactive").required(),
    description: Joi.string().trim().min(1).optional(),
    image_path: Joi.string().trim().min(1).optional(),
    reference_no: Joi.string().trim().min(1).optional(),
    expense_date: Joi.date().optional(),

    expense_detail_list: Joi.array().items(Joi.object({
        description: Joi.string().trim().min(1).optional(),
        amount: Joi.number().required(),
    })).required(),

    expense_payment_list: Joi.array().items(Joi.object({
        payment_no: Joi.string().trim().min(1).required(),
        description: Joi.string().trim().min(1).optional(),
        accountOid: Joi.string().valid("Cash", "Card").required(),
    })).required(),
});

const update_controller = {
    method: "POST",
    path: API.CONTEXT + API.MASTER_EXPENSE_UPDATE,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "update expense information",
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
            log.info(`Successfully updated`);
            return { status: true, code: 200, message: MESSAGE.SUCCESS_UPDATE };
        }
        return { status: false, code: 409, message: update_data_return.message };
    } catch (err) {
        log.error(`An exception occurred while updating expense info: ${err}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const update_data = async (request) => {
    try {
        const userInfo = await autheticatedUserInfo(request);
        request.payload.userInfo = userInfo;

        const expenseSummary = ready(request);
        const executeUpdateExpense = await updateExpense(request, expenseSummary);
        if (!executeUpdateExpense) {
            return {
                status: false,
                message: "update expense execution failed"
            }
        }

        const executeDeleteExpenseDetail = await deleteExpenseDetail(request, expenseSummary.oid);
        if(!executeDeleteExpenseDetail){
            return {
                status: false,
                message: "delete expense execution failed"
            }
        }
        await deletePayment(request, expenseSummary);

        
        expenseSummary.expenseDetailList.forEach(async (element) => {
            await saveExpenseDetail(request, expenseSummary, element);
        })

        return {
            status: true
        }
    } catch (error) {
        throw error;
    }

};



const saveExpenseDetail = async (request, expenseSummary, expenseDetail) => {
    const { oid, amount, sortOrder, description } = expenseDetail;
    const { userInfo } = request.payload;
    let executed;
    let idx = 1;
    let cols = ["oid", "amount", "expenseOid", "sortOrder", "companyOid"];
    let params = [`$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`];
    let data = [oid, amount, expenseSummary.oid, sortOrder, userInfo.companyoid];


    if (description) {
        cols.push("description");
        params.push(`$${idx++}`);
        data.push(description);
    }


    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.EXPENSE_DETAIL} (${scols}) values (${sparams})`;
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


const updateExpense = async (request, expense) => {
    const { oid, expenseDate, expenseBy, status, imagePath, description, referenceNo, expenseAmount, paidAmount, dueAmount } = expense;
    const { userInfo } = request.payload;
    let executed;
    let idx = 1;
    let cols = [`expenseBy = $${idx++}`, `status = $${idx++}`, `editedBy = $${idx++}`, `editedOn = now()`];
    let data = [expenseBy, status, userInfo.loginid];


    if (expenseDate) {
        cols.push(`expenseDate = $${idx++}`);
        data.push(expenseDate);
    } else {
        cols.push(`expenseDate = null`);
    }

    if (imagePath) {
        cols.push(`imagePath = $${idx++}`);
        data.push(imagePath);
    }

    if (description) {
        cols.push(`description = $${idx++}`);
        data.push(description);
    }

    if (referenceNo) {
        cols.push(`referenceNo = $${idx++}`);
        data.push(referenceNo);
    }

    if (expenseAmount && expenseAmount > 0) {
        cols.push(`expenseAmount = $${idx++}`);
        data.push(expenseAmount);
    }

    if (paidAmount && paidAmount > 0) {
        cols.push(`paidAmount = $${idx++}`);
        data.push(paidAmount);
    }

    if (dueAmount && dueAmount > 0) {
        cols.push(`dueAmount = $${idx++}`);
        data.push(dueAmount);
    }


    let scols = cols.join(', ')
    let query = `update ${TABLE.EXPENSE_SUMMARY} set ${scols} where 1 = 1 and oid = $${idx++}`;
    data.push(oid)
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

const deleteExpenseDetail = async (request, expenseOid) => {
    let executed;
    let data = [expenseOid];
    let query = `delete from ${TABLE.EXPENSE_DETAIL} where 1 = 1 and expenseOid = $1`;
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

const deletePayment = async (request, expenseSummary) => {
    let executed;
    let data = [expenseSummary.oid, "Expense"];
    let query = `delete from ${TABLE.PAYMENT} where 1 = 1 and referenceOid = $1 and referenceType = $2`;
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


const ready = (request) => {
    const { expense_detail_list, expense_payment_list, expense_by, status, description, image_path, reference_no, expense_date } = request.payload;
    let expenseDetailList = [];
    let expenseAmount = 0;
    expense_detail_list.forEach((ed, index) => {
        const el = {
            oid: uuid.v4(),
            sortOrder: index,
            amount: ed.amount,
            description: ed.description
        }
        expenseDetailList.push(el);
        expenseAmount += el.amount;
    });


    let paidAmount = 0;
    let expensePaymentList = [];
    expense_payment_list.forEach((ep, index) => {
        const el = {
            oid: uuid.v4(),
            amount: ep.amount,
            description: ep.description
        }
        expense_payment_list.push(el);
        paidAmount += el.amount
    });

    const dueAmount = expenseAmount - paidAmount;
    const expenseSummary = {
        oid: request.payload["oid"],
        expenseNo: new Date().getTime(),
        expenseBy: expense_by,
        status: status,
        description: description,
        imagePath: image_path,
        referenceNo: reference_no,
        expenseDate: new Date(expense_date).toISOString().slice(0, 10),
        expenseAmount: expenseAmount,
        paidAmount: paidAmount,
        dueAmount: dueAmount,
        expenseDetailList: expenseDetailList
    }
    return expenseSummary;
}


module.exports = update_controller;
