"use strict";

const Joi = require("@hapi/joi");
const uuid = require('uuid');
const log = require("../../../../util/log");
const Dao = require("../../../../util/dao");
const { API, MESSAGE, TABLE } = require("../../../../util/constant");
const { autheticatedUserInfo } = require("../../../../util/helper");

const payload_scheme = Joi.object({
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
    path: API.CONTEXT + API.MASTER_SETTINGS_SAVE_EMPLOYEE,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "save setting employee information",
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
        log.error(`An exception occurred while saving settings employee info: ${err}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const save_data = async (request) => {
    try {
        const userInfo = await autheticatedUserInfo(request);
        request.payload.userInfo = userInfo;
        const save_employee = await saveEmployee(request);
        if (!save_employee) {
            return {
                status: false,
                message: "Problem in save employee"
            }
        }
        return {
            status: true
        }
    } catch (error) {
        throw error;
    }

};



const saveEmployee = async (request) => {
    const { name_en, status, employee_type, name_bn, mobile_no, company_mobile_no, email, image_path, nid, passport_no, department_oid, designation_oid, bank_account_title, bank_account_no, bank_oid, gross_salary, mobile_limit, tax, userInfo, joining_date } = request.payload;
    let executed;
    let idx = 1;
    let cols = ["oid", "nameEn", "status", "employeeType", "createdBy", "createdOn", "companyOid"];
    let params = [`$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`,];
    const id = uuid.v4();
    let data = [id, name_en, status, employee_type, userInfo.loginid, "now()", userInfo.companyoid];


    if (name_bn) {
        cols.push("nameBn");
        params.push(`$${idx++}`)
        data.push(name_bn)
    }


    if (mobile_no) {
        cols.push("mobileNo");
        params.push(`$${idx++}`)
        data.push(mobile_no)
    }


    if (company_mobile_no) {
        cols.push("companyMobileNo");
        params.push(`$${idx++}`)
        data.push(company_mobile_no)
    }


    if (email) {
        cols.push("email");
        params.push(`$${idx++}`)
        data.push(email)
    }

    if (image_path) {
        cols.push("imagePath");
        params.push(`$${idx++}`)
        data.push(image_path)
    }

    if (nid) {
        cols.push("nid");
        params.push(`$${idx++}`)
        data.push(nid)
    }

    if (passport_no) {
        cols.push("passportNo");
        params.push(`$${idx++}`)
        data.push(passport_no)
    }

    if (department_oid) {
        cols.push("departmentOid");
        params.push(`$${idx++}`)
        data.push(department_oid)
    }

    if (designation_oid) {
        cols.push("designationOid");
        params.push(`$${idx++}`)
        data.push(designation_oid)
    }

    if (bank_account_title) {
        cols.push("bankAccountTitle");
        params.push(`$${idx++}`)
        data.push(bank_account_title)
    }

    if (bank_account_no) {
        cols.push("bankAccountNo");
        params.push(`$${idx++}`)
        data.push(bank_account_no)
    }


    if (bank_oid) {
        cols.push("bankOid");
        params.push(`$${idx++}`)
        data.push(bank_oid)
    }


    if (gross_salary && gross_salary > 0) {
        cols.push("grossSalary");
        params.push(`$${idx++}`)
        data.push(gross_salary)
    }


    if (mobile_limit && mobile_limit > 0) {
        cols.push("mobileLimit");
        params.push(`$${idx++}`)
        data.push(gross_salary)
    }


    if (tax && tax > 0) {
        cols.push("tax");
        params.push(`$${idx++}`)
        data.push(tax)
    }

    if (joining_date) {
        cols.push("joiningDate");
        params.push(`to_date($${idx++}, 'YYYY-MM-DD')::date`)
        data.push(joining_date)
    }


    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.EMPLOYEE} (${scols}) values (${sparams})`;
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
