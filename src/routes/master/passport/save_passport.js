"use strict";

const Joi = require("@hapi/joi");
const uuid = require('uuid');
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const payload_scheme = Joi.object({
    full_name: Joi.string().trim().min(1).required(),
    sur_name: Joi.string().trim().min(1).required(),
    given_name: Joi.string().trim().min(1).required(),
    gender: Joi.string().trim().min(1).required(),
    nationality: Joi.string().trim().min(1).required(),
    passport_number: Joi.string().trim().min(1).required(),
    customer_oid: Joi.string().trim().min(1).required(),

    birth_date: Joi.date().optional(),
    passport_issue_date: Joi.date().optional(),
    passport_expiry_date: Joi.date().optional(),
    status: Joi.string().trim().min(1).optional(),
    country_code: Joi.string().trim().min(1).optional(),
    country_oid: Joi.string().trim().min(1).optional(),
    mobile_no: Joi.string().trim().min(1).optional(),
    email: Joi.string().trim().min(1).optional(),
    personal_no: Joi.string().trim().min(1).optional(),
    birth_registration_no: Joi.string().trim().min(1).optional(),
    previous_passport_number: Joi.string().trim().min(1).optional(),
    passport_image_path: Joi.string().trim().min(1).optional(),
    issuing_authority: Joi.string().trim().min(1).optional(),
    description: Joi.string().trim().min(1).optional(),

    passport_detail_list: Joi.array().items(Joi.object({
        title: Joi.string().trim().min(1).required(),
        image_path: Joi.string().trim().min(1).required(),
        remarks: Joi.string().trim().optional(),
    })).required(),
    passport_command_list: Joi.array().items(Joi.object({
        title: Joi.string().trim().min(1).required(),
        command: Joi.string().trim().min(1).required(),
        remarks: Joi.string().trim().optional(),
    })).required(),
    passport_notification_list: Joi.array().items(Joi.object({
        name: Joi.string().trim().min(1).required(),
        notification_value: Joi.string().trim().min(1).required(),
        subscribe: Joi.string().trim().min(1).required(),
        remarks: Joi.string().trim().optional(),
    })).required(),

});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.MASTER_PASSPORT_SAVE_PATH,
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
    let save_data_return;
    try {
        save_data_return = await save_data(request);
        if (save_data_return.status) {
            log.info(`Successfully saved`);
            return { status: true, code: 200, message: MESSAGE.SUCCESS_SAVE };
        }
        return { status: false, code: 409, message: save_data_return.message };
    } catch (err) {
        log.error(`An exception occurred while saving passport info: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const save_data = async (request) => {
    try {
        const userInfo = await autheticatedUserInfo(request);
        request.payload.userInfo = userInfo;
        const count = await getCount(request);
        if (count > 0) {
            return {
                message: "Duplicate value",
                status: false
            }
        }

    } catch (error) {
        throw error;
    }

};


const savePassport = async (request) => {
    const { full_name, sur_name, given_name, gender, nationality, passport_number, customer_oid, userInfo, birth_date, passport_issue_date, passport_expiry_date, status, country_code, country_oid, mobile_no, email, personal_no, birth_registration_no, previous_passport_number, passport_image_path, issuing_authority, description } = request.payload;
    let executed;
    let idx = 1;
    let cols = ["oid", "fullName", "surName", "givenName", "gender", "nationality", "passportNumber", "customerOid", "companyOid"];
    let params = [`$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`,];
    const id = uuid.v4()
    let data = [id, full_name, sur_name, given_name, gender, nationality, passport_number, customer_oid, userInfo.companyoid]


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



const savePassportDetail = async (userInfo, passportDetail, sortOrderNo, passportOid) => {
    const { title, image_path, remarks } = passportDetail;
    let executed;
    let idx = 1;
    let cols = ["oid", "title", "imagePath", "sortOrder", "passportOid", "companyOid"];
    let params = [`$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`];
    const id = uuid.v4();
    let data = [id, title, image_path, sortOrderNo, passportOid, userInfo.companyoid]


    if (remarks) {
        cols.push("remarks");
        params.push(`$${idx++}`);
        data.push(remarks);
    }


    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.PASSPORT_DETAIL} (${scols}) values (${sparams})`;
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



const savePassportCommand = async (userInfo, passportCommand, sortOrderNo, passportOid) => {
    const { title, command, remarks } = passportCommand;
    let executed;
    let idx = 1;
    let cols = ["oid", "title", "command", "sortOrder", "passportOid", "companyOid"];
    let params = [`$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`];
    const id = uuid.v4();
    let data = [id, title, command, sortOrderNo, passportOid, userInfo.companyoid]


    if (remarks) {
        cols.push("remarks");
        params.push(`$${idx++}`);
        data.push(remarks);
    }


    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.PASSPORT_COMMAND} (${scols}) values (${sparams})`;
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




const savePassengerNotification = async (userInfo, passengerNotification, sortOrderNo, passportOid) => {
    const { name, notification_value, subscribe, remarks } = passengerNotification;
    let executed;
    let idx = 1;
    let cols = ["oid", "name", "notificationValue", "subscribe", "sortOrder",
        "passportOid", "companyOid"];
    let params = [`$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`];
    const id = uuid.v4();
    let data = [id, name, notification_value, subscribe, sortOrderNo, passportOid, userInfo.companyoid]


    if (remarks) {
        cols.push("remarks");
        params.push(`$${idx++}`);
        data.push(remarks);
    }


    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.PASSENGER_NOTIFICATION} (${scols}) values (${sparams})`;
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


const getCount = async (request) => {
    const { passport_number, customer_oid, userInfo } = request.payload;
    let count = 0;
    let data = [passport_number, customer_oid, userInfo.companyoid];

    let query = `select count(*) as total from ${TABLE.PASSENGER_NOTIFICATION}  where 1 = 1 and passportNumber = $1 and customerOid = $2 and companyOid = $3`;

    let sql = {
        text: query,
        values: data
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql);
        count = data_set[0]["total"];
        log.info(count)
    } catch (err) {
        log.error(err)
        throw new Error(err);
    }
    return count;
}



module.exports = save_controller;
