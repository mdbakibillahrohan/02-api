"use strict";

const Joi = require("@hapi/joi");
const uuid = require('uuid');
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const payload_scheme = Joi.object({
    oid: Joi.string().trim().min(1).required(),
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
    passenger_notification_list: Joi.array().items(Joi.object({
        name: Joi.string().trim().min(1).required(),
        notification_value: Joi.string().trim().min(1).required(),
        subscribe: Joi.string().trim().min(1).required(),
        remarks: Joi.string().trim().optional(),
    })).required(),
    passport_visa_list: Joi.array().items(Joi.object({
        visa_number: Joi.string().trim().min(1).required(),
        visa_type: Joi.string().trim().min(1).optional(),
        visa_issue_date: Joi.date().optional(),
        visa_expiry_date: Joi.date().optional(),
        country: Joi.string().trim().min(1).optional(),
        image_path: Joi.string().trim().min(1).optional(),
        remarks: Joi.string().trim().min(1).optional(),
        status: Joi.string().trim().min(1).optional(),
    })).required(),

});

const update_controller = {
    method: "POST",
    path: API.CONTEXT + API.MASTER_PASSPORT_UPDATE_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "update Passport information",
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
        update_data_return = await upate_data(request);
        if (update_data_return.status) {
            log.info(`Successfully updated`);
            return { status: true, code: 200, message: MESSAGE.SUCCESS_UPDATE };
        }
        return { status: false, code: 409, message: update_data_return.message };
    } catch (err) {
        log.error(`An exception occurred while updating passport info: ${err}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const upate_data = async (request) => {
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
        const update_passport = await updatePassport(request, passportOid);
        if (!update_passport) {
            return {
                status: false,
                message: "Problem in update passport"
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



const updatePassport = async (request) => {
    const { oid, full_name, sur_name, given_name, gender, nationality, passport_number, customer_oid, userInfo, birth_date, passport_issue_date, passport_expiry_date, status, country_code, country_oid, mobile_no, email, personal_no, birth_registration_no, previous_passport_number, passport_image_path, issuing_authority, description } = request.payload;
    let executed;
    let idx = 1;
    let cols = [`oid = $${idx++},fullName = $${idx++}, surName = $${idx++}, givenName = $${idx++}, gender = $${idx++}, nationality = $${idx++}, passportNumber = $${idx++}, customerOid = $${idx++}, countryOid = $${idx++}, editedBy = $${idx++}, editedOn = now() `];

    let data = [oid, full_name, sur_name, given_name, gender, nationality, passport_number, customer_oid, userInfo.companyoid]


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



const savePassportDetail = async (request, userInfo, passportDetail, sortOrderNo, passportOid) => {
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



const savePassportCommand = async (request, userInfo, passportCommand, sortOrderNo, passportOid) => {
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




const savePassengerNotification = async (request, userInfo, passengerNotification, sortOrderNo, passportOid) => {
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


const savePassportVisa = async (request, userInfo, passportVisa, sortOrderNo, passportOid) => {
    const { visa_number, visa_type, visa_issue_date, visa_expiry_date, country, image_path, remarks, status } = passportVisa;
    let executed;
    let idx = 1;
    let cols = ["oid", "visaNumber", "sortOrder", "passportOid", "companyOid"];
    let params = [`$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`];
    const id = uuid.v4();
    let data = [id, visa_number, sortOrderNo, passportOid, userInfo.companyoid]

    if (visa_type) {
        cols.push("visaType");
        params.push(`$${idx++}`)
        data.push(visa_type)
    }



    if (visa_issue_date) {
        cols.push("visaIssueDate");
        params.push(`$${idx++}`)
        data.push(visa_issue_date)
    }


    if (visa_expiry_date) {
        cols.push("visaExpiryDate");
        params.push(`$${idx++}`)
        data.push(visa_expiry_date)
    }


    if (country) {
        cols.push("country");
        params.push(`$${idx++}`)
        data.push(country)
    }


    if (image_path) {
        cols.push("imagePath");
        params.push(`$${idx++}`)
        data.push(image_path)
    }



    if (remarks) {
        cols.push("remarks");
        params.push(`$${idx++}`);
        data.push(remarks);
    }


    if (status) {
        cols.push("status");
        params.push(`$${idx++}`);
        data.push(status);
    }


    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.PASSPORT_VISA_INFORMATION} (${scols}) values (${sparams})`;
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


const deletePassportDetail = async (passportOid) => {
    let executed;
    let data = [passportOid]
    let query = `delete from ${TABLE.PASSPORT_DETAIL}  where 1 = 1 and passportOid = $1`;
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


const deletePassportVisa = async (passportOid) => {
    let executed;
    let data = [passportOid]
    let query = `delete from ${TABLE.PASSPORT_VISA_INFORMATION}  where 1 = 1 and passportOid = $1`;
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


const deletePassportCommand = async (passportOid) => {
    let executed;
    let data = [passportOid]
    let query = `delete from ${TABLE.PASSPORT_COMMAND}  where 1 = 1 and passportOid = $1`;
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



const deleteNotificationSql = async (passportOid) => {
    let executed;
    let data = [passportOid]
    let query = `delete from ${TABLE.PASSENGER_NOTIFICATION}  where 1 = 1 and passportOid = $1`;
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

    let query = `select count(*) as total from ${TABLE.PASSPORT}  where 1 = 1 and passportNumber = $1 and customerOid = $2 and companyOid = $3`;

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



module.exports = update_controller;
