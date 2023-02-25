"use strict";

const Joi = require("@hapi/joi");
const log = require("../../util/log");
const Dao = require("../../util/dao");
const Helper = require("../../util/helper")
const uuid = require('uuid');
const { API, MESSAGE, TABLE } = require("../../util/constant");

const payload_scheme = Joi.object({
    passenger_id: Joi.string(),
    full_name: Joi.string().trim().min(3).max(30).required(),
    surname: Joi.string().trim().min(3).max(30).required(),
    given_name: Joi.string().trim().min(3).max(30).required(),
    address: Joi.string().trim().min(5).max(70),
    gender: Joi.string().trim().min(4).max(6),
    mobile_no: Joi.string().trim().min(7).max(15),
    email: Joi.string().email(),
    nationality: Joi.string().min(3).max(30),
    country_code: Joi.string(),
    birth_registration_no: Joi.string().trim().min(3).max(30),
    personal_no: Joi.string().trim().min(7).max(15),
    passport_number: Joi.string().trim().min(5).max(40),
    previous_passport_number: Joi.string().trim().min(5).max(40),
    birthdate: Joi.date(),
    passport_issue_date: Joi.date(),
    passport_expiry_date: Joi.date(),
    passport_image_path: Joi.string(),
    issuing_authority: Joi.string(),
    description: Joi.string(),
    status: Joi.string(),
    country_oid: Joi.string(),
    customer_oid: Joi.string(),
});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.SAVE_PASSPORT,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Save Passport",
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
    try {
        await save_data(request);
        log.info(`Successfully saved`);
        return { status: true, code: 200, message: MESSAGE.SUCCESS_SAVE };
    } catch (err) {
        log.error(`An exception occurred while saving: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const save_data = async (request) => {
    const { passenger_id, full_name, surname, given_name, gender, mobile_no, email, nationality, country_code, birth_registration_no, personal_no, passport_number, previous_passport_number, birthdate, passport_issue_date, passport_expiry_date, passport_image_path, issuing_authority, description, status, country_oid, customer_oid } = request.payload;

    const userInfo = await Helper.autheticatedUserInfo(request);
    const id = uuid.v4();
    let cols = ['oid', 'passengerid', 'fullname', 'surname', 'givenname', 'gender', 'mobileno', 'email', 'nationality', 'countrycode', 'birthregistrationno', 'personalno', 'passportnumber', 'previouspassportnumber', 'birthdate', 'passportissuedate', 'passportexpirydate', 'passportimagepath', 'issuingauthority', 'description', 'status', 'createdby', 'createdon', 'countryoid', 'customeroid', 'companyoid'];
    let params = ['$1', '$2', '$3', '$4', '$5', '$6', '$7', '$8', '$9', '$10', '$11', '$12', '$13   ', '$14', '$15', '$16', '$17', '$18', '$19', '$20', '$21', '$22', 'clock_timestamp()', '$23', '$24', '$25'];
    let data = [id, passenger_id, full_name, surname, given_name, gender, mobile_no, email, nationality, country_code, birth_registration_no, personal_no, passport_number, previous_passport_number, birthdate, passport_issue_date, passport_expiry_date, passport_image_path, issuing_authority, description, status, userInfo.oid, country_oid, customer_oid, userInfo.companyoid];

    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.PASSPORT} (${scols}) values (${sparams})`;
    let sql = {
        text: query,
        values: data
    }
    await Dao.execute_value(request.pg, sql)
};


module.exports = save_controller;
