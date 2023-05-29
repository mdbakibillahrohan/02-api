"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, TABLE, MESSAGE, CONSTANT } = require("../../../util/constant");
const uuid = require('uuid');
const { autheticatedUserInfo } = require("../../../util/helper");

const payload_scheme = Joi.object({
    ticket_oid: Joi.string().trim().min(1).max(128).required(),
    passenger_name: Joi.string().trim().min(1).max(128).required(),
    passport_number: Joi.number().required(),
    flight_number: Joi.number().required(),
    visa_number: Joi.number().required(),
    visa_type: Joi.string().trim().min(1).max(64).required(),
    departure_date: Joi.date().optional(),
    birth_date: Joi.date().optional(),
    passport_expiry_date: Joi.date().optional(),
    visa_expiry_date: Joi.date().optional(),
    gender: Joi.string().trim().valid('male', 'female','transger', 'others').optional(),
    nationality: Joi.string().trim().min(1).max(64).optional(),
    address_for_foreigners: Joi.string().trim().min(1).optional(),
    purpose_of_visit: Joi.string().trim().min(1).optional(),
});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.TICKET_MODIFICATION_SAVE_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "save",
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
        const userInfo = await autheticatedUserInfo(request);
        const oid = uuid.v4();
        const save = await save_data(userInfo, oid, request);
        const update_ticket = await updateTicket(userInfo, oid, request);

        if(save["rowCount"] == 1 && update_ticket["rowCount"]==1){      
            log.info(`Successfully saved`);
            return { status: true, code: 200, message: MESSAGE.SUCCESS_SAVE }; 
        }
        
        log.info(MESSAGE.INTERNAL_SERVER_ERROR);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    } catch (err) {
        log.error(`An exception occurred while saving: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const updateTicketInvoice = async (userInfo, oid, request) => {
    let cols = [ ];

    let params = ['$1', '$2', '$3', '$4', '$5', '$6', '$7', '$8', "$9"];

    let data = [oid, request.payload["passenger_name"], request.payload["passport_number"], request.payload["flight_number"], request.payload["visa_number"], request.payload["visa_type"], userInfo.loginid, 'now()', userInfo.companyoid];

    let idx = 10;
    if (request.payload["departure_date"]) {
        cols.push("departureDate");
        params.push(`$${idx++}`);
        data.push(request.payload["departure_date"]);
    }
    if (request.payload["birth_date"]) {
        cols.push("birthDate");
        params.push(`$${idx++}`);
        data.push(request.payload["birth_date"]);
    }
    if (request.payload["passport_expiry_date"]) {
        cols.push("passportExpiryDate");
        params.push(`$${idx++}`);
        data.push(request.payload["passport_expiry_date"]);
    }
    if (request.payload["visa_expiry_date"]) {
        cols.push("visaExpiryDate");
        params.push(`$${idx++}`);
        data.push(request.payload["visa_expiry_date"]);
    }
    if (request.payload["gender"]) {
        cols.push("gender");
        params.push(`$${idx++}`);
        data.push(request.payload["gender"]);
    }
    if (request.payload["nationality"]) {
        cols.push("nationality");
        params.push(`$${idx++}`);
        data.push(request.payload["nationality"]);
    }
    if (request.payload["address_for_foreigners"]) {
        cols.push("addressForForeigners");
        params.push(`$${idx++}`);
        data.push(request.payload["address_for_foreigners"]);
    }
    if (request.payload["purpose_of_visit"]) {
        cols.push("purposeOfVisit");
        params.push(`$${idx++}`);
        data.push(request.payload["purpose_of_visit"]);
    }

    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.DEPARTURE_CARD} (${scols}) values (${sparams})`;
    let sql = {
        text: query,
        values: data
    }
    try {
        return await Dao.execute_value(request.pg, sql);
    } 
    catch (err) {
        log.error(`An exception occurred while saving: ${err} `)
    }
};

const updateTicket = async (userInfo, oid, request) => {

    let cols = [ "departureCardOid = $1"];

    let data = [oid];
    

    let scols = cols.join(', ')

    let query = `update ${ TABLE.TICKET } set ${scols} where 1 = 1 and oid = $2`;
    data.push(request.payload.ticket_oid)

    let sql = {
        text: query,
        values: data
    }
    try{
        return await Dao.execute_value(request.pg, sql)
    } 
    catch(err) {
        log.error(`An exception occurred while updating: ${err?.message}`)
    }
}


module.exports = save_controller;
