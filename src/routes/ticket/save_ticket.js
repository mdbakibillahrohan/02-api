"use strict";

const Joi = require("@hapi/joi");
const log = require("../../util/log");
const Dao = require("../../util/dao");
const Helper = require("../../util/helper")
const uuid = require('uuid');
const { API, MESSAGE, TABLE } = require("../../util/constant");

const payload_scheme = Joi.object({
    name_en: Joi.string().trim().min(3).max(30).required(),
    name_bn: Joi.string().trim().min(3).max(30).required(),
    mobile_no: Joi.string().trim().min(7).max(15),
    company_mobile_no: Joi.string().trim().min(7).max(15),
    email: Joi.string().email(),
    image_path: Joi.string().empty(),
    nid: Joi.string().required(),
    passport_no: Joi.string(),
    date_of_brith: Joi.date(),
    joining_date: Joi.date(),
    gender: Joi.string(),
    marital_status: Joi.string(),
    blood_group: Joi.string(),
    permanent_address: Joi.string().trim().min(5).max(70),
    present_address: Joi.string().trim().min(5).max(70),
    employee_type: Joi.string(),
    status: Joi.string(),
    gross_salary: Joi.number(),
    mobile_limit: Joi.number(),
    tax: Joi.number(),
    bank_account_title: Joi.string(),
    bank_account_number: Joi.string(),
    bank_oid: Joi.string(),
    department_oid: Joi.string(),
    desgination_oid: Joi.string(),
});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.SAVE_TICKET,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Save Ticket",
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
    try {
        await save_data(request);
        log.info(`Successfully saved`);
        return { status: true, code: 200, message: MESSAGE.SUCCESS_SAVE };
    } catch (err) {
        log.error(`An exception occurred while saving: ${err}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const save_data = async (request) => {
    const { name_en, name_bn, mobile_no, company_mobile_no, email, image_path, nid, passport_no, date_of_brith, joining_date, gender, marital_status, blood_group, permanent_address, present_address, employee_type, status, gross_salary, mobile_limit, tax, bank_account_title, bank_account_number, bank_oid, department_oid, desgination_oid } = request.payload;

    const userInfo = await Helper.autheticatedUserInfo(request);
    const id = uuid.v4();
    let cols = ['oid', 'employeeid', 'nameen', 'namebn', 'mobileno', 'companymobileno', 'email', 'imagepath', 'nid', 'passportno', 'dateofbirth', 'joiningdate', 'gender', 'maritalstatus', 'bloodgroup', 'permanentaddress', 'presentaddress', 'employeetype', 'status', 'grosssalary', 'mobilelimit', 'tax', 'bankaccounttitle', 'bankaccountno', 'bankoid', 'departmentoid', 'designationoid', 'companyoid', 'createdon', 'createdby'];
    let params = ['$1', '$2', '$3', '$4', '$5', '$6', '$7', '$8', '$9', '$10', '$11', '$12', '$13', '$14', '$15', '$16', '$17', '$18', '$19', '$20', '$21', '$22', '$23', '$24', '$25', '$26', '$27', '$28', 'clock_timestamp()', '$29'];
    let data = [id, id, name_en, name_bn, mobile_no, company_mobile_no, email, image_path, nid, passport_no, date_of_brith, joining_date, gender, marital_status, blood_group, permanent_address, present_address, employee_type, status, gross_salary, mobile_limit, tax, bank_account_title, bank_account_number, bank_oid, department_oid, desgination_oid, userInfo.companyoid, userInfo.oid];

    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.EMPLOYEE} (${scols}) values (${sparams})`;
    let sql = {
        text: query,
        values: data
    }
    await Dao.execute_value(request.pg, sql)
};


module.exports = save_controller;
