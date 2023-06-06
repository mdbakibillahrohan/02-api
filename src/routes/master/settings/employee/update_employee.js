"use strict";

const Joi = require("@hapi/joi");
const uuid = require('uuid');
const log = require("../../../../util/log");
const Dao = require("../../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../../util/constant");
const { autheticatedUserInfo } = require("../../../../util/helper");


const payload_scheme = Joi.object({
    oid: Joi.string().trim().min(1).required(),
    name_en: Joi.string().trim().min(1).required(),
    status: Joi.string().trim().valid("Active", "Inactive").required(),
    employee_type: Joi.string().trim().min(1).required(),

    name_bn: Joi.string().trim().min(1).optional(),
    mobile_no: Joi.string().trim().min(1).optional(),
    company_mobile_no: Joi.string().trim().min(1).optional(),
    email: Joi.string().trim().email().optional(),
    image_path: Joi.string().trim().min(1).optional(),
    nid: Joi.string().trim().min(1).optional(),
    passport_no: Joi.string().trim().min(1).optional(),
    department_oid: Joi.string().trim().min(1).optional(),
    designation_oid: Joi.string().trim().min(1).optional(),
    bank_account_title: Joi.string().trim().min(1).optional(),
    bank_account_no: Joi.string().trim().min(1).optional(),
    bank_oid: Joi.string().trim().min(1).optional(),
    gross_salary: Joi.number().optional(),
    mobile_limit: Joi.number().optional(),
    tax: Joi.number().optional(),
    joining_date: Joi.date().optional(),

});


const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.MASTER_SETTINGS_UPDATE_EMPLOYEE,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "update setting employee information",
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
        log.error(`An exception occurred while updating setting employee info: ${err}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const update_data = async (request) => {
    try {
        const userInfo = await autheticatedUserInfo(request);
        request.payload.userInfo = userInfo;
        const update_employee = await updateEmployee(request);
        if (!update_employee) {
            return {
                status: false,
                message: "Problem in update employee"
            }
        }
        return {
            status: true
        }
    } catch (error) {
        throw error;
    }

};



const updateEmployee = async (request) => {
    const { oid, name_en, status, employee_type, name_bn, mobile_no, company_mobile_no, email, image_path, nid, passport_no, department_oid, designation_oid, bank_account_title, bank_account_no, bank_oid, gross_salary, mobile_limit, tax, userInfo, joining_date } = request.payload;
    let executed;
    let idx = 1;
    let cols = [`nameEn = $${idx++}`, `status = $${idx++}`, `employeeType = $${idx++}`, `editedBy = $${idx++}`, `editedOn = now()`];

    let data = [name_en, status, employee_type, userInfo.loginid];

    if (name_bn) {
        cols.push(`nameBn = $${idx++}`);
        data.push(name_bn)
    }


    if (mobile_no) {
        cols.push(`mobileNo = $${idx++}`);
        data.push(mobile_no)
    }


    if (company_mobile_no) {
        cols.push(`companyMobileNo = $${idx++}`);
        data.push(company_mobile_no)
    }


    if (email) {
        cols.push(`email = $${idx++}`);
        data.push(email)
    }

    if (image_path) {
        cols.push(`imagePath = $${idx++}`);
        data.push(image_path)
    }

    if (nid) {
        cols.push(`nid = $${idx++}`);
        data.push(nid)
    }

    if (passport_no) {
        cols.push(`passportNo = $${idx++}`);
        data.push(passport_no)
    }

    if (department_oid) {
        cols.push(`departmentOid = $${idx++}`);
        data.push(department_oid)
    }

    if (designation_oid) {
        cols.push(`designationOid = $${idx++}`);
        data.push(designation_oid)
    }

    if (bank_account_title) {
        cols.push(`bankAccountTitle = $${idx++}`);
        data.push(bank_account_title)
    }

    if (bank_account_no) {
        cols.push(`bankAccountNo = $${idx++}`);
        data.push(bank_account_no)
    }


    if (bank_oid) {
        cols.push(`bankOid = $${idx++}`);
        data.push(bank_oid)
    }


    if (gross_salary && gross_salary > 0) {
        cols.push(`grossSalary = $${idx++}`);
        data.push(gross_salary)
    }


    if (mobile_limit && mobile_limit > 0) {
        cols.push(`mobileLimit = $${idx++}`);
        data.push(gross_salary)
    }


    if (tax && tax > 0) {
        cols.push(`tax = $${idx++}`);
        data.push(tax)
    }

    if (joining_date) {
        cols.push(`joiningDate = to_date($${idx++}, 'YYYY-MM-DD')::date`);
        data.push(joining_date)
    }

    let scols = cols.join(', ')
    let query = `update ${TABLE.EMPLOYEE} set ${scols} where 1 = 1 and oid = $${idx++}`;
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
