"use strict";

const Joi = require("@hapi/joi");
const uuid = require('uuid');
const log = require("../../../../util/log");
const Dao = require("../../../../util/dao");
const { API, MESSAGE, TABLE } = require("../../../../util/constant");
const { autheticatedUserInfo } = require("../../../../util/helper");

const payload_scheme = Joi.object({
    customer_id: Joi.string().trim().min(1).required(),
    name: Joi.string().trim().min(1).required(),
    address: Joi.string().trim().min(1).required(),
    imagePath: Joi.string().trim().min(1).required(),

    mobile_no: Joi.string().trim().min(1).optional(),
    email: Joi.string().trim().email().optional(),
    discountt_type: Joi.string().valid("Pct", "Fixed").optional(),
    status: Joi.string().valid("Active", "Inactive").optional(),
    commission_type: Joi.string().trim().min(1).optional(),
    employee_id: Joi.string().trim().min(1).optional(),

    name_en: Joi.string().trim().min(1).optional(),
    name_bn: Joi.string().trim().min(1).optional(),
    company_mobile_no: Joi.string().trim().min(1).optional(),
    nid: Joi.string().trim().min(1).optional(),
    passport_no: Joi.string().trim().min(1).optional(),

    gender: Joi.string().valid("Male", "Female", "Others").optional(),
    marital_status: Joi.string().trim().min().optional(),
    blood_group: Joi.string().trim().min(1).optional(),

    permanent_address: Joi.string().trim().min(1).optional(),
    present_address: Joi.string().trim().min(1).optional(),
    employeet_type: Joi.string().trim().min(1).optional(),

});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.MASTER_SETTINGS_SAVE_USER_PROFILE,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "save setting user_profile information",
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
        log.error(`An exception occurred while saving settings user_profile info: ${err}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const save_data = async (request) => {
    try {
        const userInfo = await autheticatedUserInfo(request);
        request.payload.userInfo = userInfo;
        const save_company = await saveCompany(request);
        if (!save_company) {
            return {
                status: false,
                message: "Problem in save user_profile"
            }
        }
        return {
            status: true
        }
    } catch (error) {
        throw error;
    }

};



const saveCompany = async (request) => {
    const { name, mnemonic, status, business_type, address, website, telephone, contact_no, hotline_number, logo_path, email_id, email_password, bank_account_title, bank_account_no, branch_name_en, branch_address, salary_json, bank_oid, package_oid } = request.payload;
    let executed;
    let idx = 1;
    let cols = ["oid", "name", "mnemonic", "status", "businessType",
        "address", "website", "telephone", "contactNo", "hotlineNumber", "logoPath", "emailId",
        "emailPassword", "bankAccountTitle", "bankAccountNo", "branchNameEn", "branchAddress",
        "salaryJson", "bankOid", "packageOid"];
    let params = [`$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`,];
    const id = uuid.v4();
    let data = [id, name, mnemonic, status, business_type, address, website, telephone, contact_no, hotline_number, logo_path, email_id, email_password, bank_account_title, bank_account_no, branch_name_en, branch_address, salary_json, bank_oid, package_oid];


    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.user_profile} (${scols}) values (${sparams})`;
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
