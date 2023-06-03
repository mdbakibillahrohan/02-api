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
    reference_no: Joi.string().trim().min(1).required(),

    expense_detail_list: Joi.array().items(Joi.object({
        description: Joi.string().trim().min(1).optional(),
        amount: Joi.number().required(),
    })).required(),
    
    expense_payment_list: Joi.array().items(Joi.object({
        payment_no: Joi.string().trim().min(1).required(),
        description: Joi.string().trim().min(1).optional(),
        accountOid: Joi.string().trim().min(1).required(),
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
        description: "save Passport information",
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
        log.error(`An exception occurred while saving passport info: ${err}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const save_data = async (request) => {
    try {
        const userInfo = await autheticatedUserInfo(request);
        request.payload.userInfo = userInfo;
        const { passport_detail_list, passport_command_list, passenger_notification_list, passport_visa_list } = request.payload;
        const count = await getCount(request);
        if (count > 0) {
            return {
                message: "Duplicate value",
                status: false
            }
        }
        const passportOid = uuid.v4();
        const save_passport = await savePassport(request, passportOid);
        if (!save_passport) {
            return {
                status: false,
                message: "Problem in save passport"
            }
        }

        passport_detail_list.forEach(async (element, index) => {
            const save_passport_detail = await savePassportDetail(request, userInfo, element, index, passportOid);
            if (!save_passport_detail) {
                return false;
            }
        });

        passport_command_list.forEach(async (element, index) => {
            const save_passport_detail = await savePassportCommand(request, userInfo, element, index, passportOid);
            if (!save_passport_detail) {
                return false;
            }
        });

        passenger_notification_list.forEach(async (element, index) => {
            const save_passport_detail = await savePassengerNotification(request, userInfo, element, index, passportOid);
            if (!save_passport_detail) {
                return false;
            }
        });

        passport_visa_list.forEach(async (element, index) => {
            const save_passport_detail = await savePassportVisa(request, userInfo, element, index, passportOid);
            if (!save_passport_detail) {
                return false;
            }
        });

        return {
            status: true
        }
    } catch (error) {
        throw error;
    }

};



const savePassport = async (request, passportId) => {
    const { full_name, sur_name, given_name, gender, nationality, passport_number, customer_oid, userInfo, birth_date, passport_issue_date, passport_expiry_date, status, country_code, country_oid, mobile_no, email, personal_no, birth_registration_no, previous_passport_number, passport_image_path, issuing_authority, description } = request.payload;
    let executed;
    let idx = 1;
    let cols = ["oid", "fullName", "surName", "givenName", "gender", "nationality", "passportNumber", "customerOid", "companyOid"];
    let params = [`$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`,];
    let data = [passportId, full_name, sur_name, given_name, gender, nationality, passport_number, customer_oid, userInfo.companyoid]


    if (birth_date) {
        cols.push("birthDate");
        params.push(`$${idx++}`);
        data.push(new Date(birth_date).toISOString().slice(0, 10));
    }


    if (passport_issue_date) {
        cols.push("passportIssueDate");
        params.push(`$${idx++}`);
        data.push(new Date(passport_issue_date).toISOString().slice(0, 10));
    }

    if (passport_expiry_date) {
        cols.push("passportExpiryDate");
        params.push(`$${idx++}`);
        data.push(new Date(passport_expiry_date).toISOString().slice(0, 10));
    }
    if (status) {
        cols.push("status");
        params.push(`$${idx++}`);
        data.push(status);
    }
    if (country_code) {
        cols.push("countryCode");
        params.push(`$${idx++}`);
        data.push(country_code);
    }
    if (country_oid) {
        cols.push("countryOid");
        params.push(`$${idx++}`);
        data.push(country_oid);
    }
    if (mobile_no) {
        cols.push("mobileNo");
        params.push(`$${idx++}`);
        data.push(mobile_no);
    }
    if (email) {
        cols.push("email");
        params.push(`$${idx++}`);
        data.push(email);
    }
    if (personal_no) {
        cols.push("personalNo");
        params.push(`$${idx++}`);
        data.push(personal_no);
    }
    if (birth_registration_no) {
        cols.push("birthRegistrationNo");
        params.push(`$${idx++}`);
        data.push(birth_registration_no);
    }

    if (previous_passport_number) {
        cols.push("previousPassportNumber");
        params.push(`$${idx++}`);
        data.push(previous_passport_number);
    }


    if (passport_image_path) {
        cols.push("passportImagePath");
        params.push(`$${idx++}`);
        data.push(passport_image_path);
    }


    if (issuing_authority) {
        cols.push("issuingAuthority");
        params.push(`$${idx++}`);
        data.push(issuing_authority);
    }


    if (description) {
        cols.push("description");
        params.push(`$${idx++}`);
        data.push(description);
    }

    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.PASSPORT} (${scols}) values (${sparams})`;
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


const ready = (request)=>{
    const {expense_detail_list, expense_payment_list} = request.payload;
    let expenseDetailList = [];
    let expenseAmount = 0;
    expense_detail_list.forEach((ed, index)=>{
        const el = {
            oid: uuid.v4(),
            sortOrder: index,
            amount: ed.amount,
            description: ed.description
        }
        expenseDetailList.push(el);
        expenseAmount+=amount;
    });


    let paidAmount = 0;
    expensePaymentList = [];
    expense_payment_list.forEach((ep, index)=>{
        const el = {
            oid: uuid.v4(),
            amount: ep.amount,
            description: ep.description
        }
        expense_payment_list.push(el);
    });
}


module.exports = save_controller;
