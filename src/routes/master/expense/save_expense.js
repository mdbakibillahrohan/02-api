"use strict";

const Joi = require("@hapi/joi");
const uuid = require('uuid');
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const payload_scheme = Joi.object({
    expense_by: Joi.string().trim().min(1).required(),
    status: Joi.string().valid("Active", "Inactive").required(),
    description: Joi.string().trim().min(1).optional(),
    image_path: Joi.string().trim().min(1).optional(),
    reference_no: Joi.string().trim().min(1).optional(),
    expense_date: Joi.date().required(),

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

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.MASTER_EXPENSE_SAVE,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "save expense information",
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
        log.error(`An exception occurred while saving expense info: ${err}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const save_data = async (request) => {
    try {
        const userInfo = await autheticatedUserInfo(request);
        request.payload.userInfo = userInfo;

        const expenseSummary = ready(request);
        const executeSaveExpense = await saveExpense(request, expenseSummary);
        if (!executeSaveExpense) {
            return {
                status: false,
                message: "Save expense execution failed"
            }
        }
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


const saveExpense = async (request, expense) => {
    const { oid, expenseNo, expenseDate, expenseBy, status, imagePath, description, referenceNo, expenseAmount, paidAmount, dueAmount } = expense;
    const { userInfo } = request.payload;
    let executed;
    let idx = 1;
    let cols = ["oid", "expenseNo", "expenseDate", "expenseBy", "status", "createdBy", "companyOid"];
    let params = [`$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`];
    let data = [oid, expenseNo, new Date(expenseDate).toISOString().slice(0, 10), expenseBy, status, userInfo.loginid, userInfo.companyoid];


    if (imagePath) {
        cols.push("imagePath");
        params.push(`$${idx++}`);
        data.push(imagePath);
    }

    if (description) {
        cols.push("description");
        params.push(`$${idx++}`);
        data.push(description);
    }

    if (referenceNo) {
        cols.push("referenceNo");
        params.push(`$${idx++}`);
        data.push(referenceNo);
    }

    if (expenseAmount && expenseAmount > 0) {
        cols.push("expenseAmount");
        params.push(`$${idx++}`);
        data.push(expenseAmount);
    }

    if (paidAmount && paidAmount > 0) {
        cols.push("paidAmount");
        params.push(`$${idx++}`);
        data.push(paidAmount);
    }

    if (dueAmount && dueAmount > 0) {
        cols.push("dueAmount");
        params.push(`$${idx++}`);
        data.push(dueAmount);
    }


    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.EXPENSE_SUMMARY} (${scols}) values (${sparams})`;
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
        oid: uuid.v4(),
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


module.exports = save_controller;
