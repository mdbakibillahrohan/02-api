"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, TABLE, MESSAGE, CONSTANT } = require("../../../util/constant");
const uuid = require('uuid');
const { autheticatedUserInfo } = require("../../../util/helper");

const payload_scheme = Joi.object({
    oid: Joi.string().trim().min(1).max(128).required(),
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
    path: API.CONTEXT + API.TICKET_DEPARTURE_CARD_UPDATE_PATH,
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
        const update = await updateDepartureCard(userInfo, request);
        
        if(update["rowCount"] == 1){      
            log.info(`Successfully saved`);
            return { status: true, code: 200, message: MESSAGE.SUCCESS_SAVE }; 
        }        
        if(update["rowCount"] == 0){      
            log.info(MESSAGE.ALREADY_UPDATE);
            return { status: true, code: 202, message: MESSAGE.ALREADY_UPDATE }; 
        }
        
        log.info(MESSAGE.INTERNAL_SERVER_ERROR);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    } catch (err) {
        log.error(`An exception occurred while saving: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const updateDepartureCard = async (userInfo, request) => {
    let cols = ["passengerName = $1", "passportNumber = $2", "flightNumber = $3", 
    "visaNumber = $4", "visaType = $5", "editedBy = $6", "editedOn = $7"];

    let data = [request.payload["passenger_name"], request.payload["passport_number"], request.payload["flight_number"], request.payload["visa_number"], request.payload["visa_type"], userInfo.loginid, 'now()'];

    let idx = 8;

    if (request.payload["departure_date"]) {
        cols.push(`departureDate = $${idx++}`);
        data.push(request.payload["departure_date"]);
    } 

    if (request.payload["birth_date"]) {
        cols.push(`birthDate = $${idx++}`);
        data.push(request.payload["birth_date"]);
    }
    if (request.payload["passport_expiry_date"]) {
        cols.push(`passportExpiryDate = $${idx++}`);
        data.push(request.payload["passport_expiry_date"]);
    }
    if (request.payload["visa_expiry_date"]) {
        cols.push(`visaExpiryDate = $${idx++}`);
        data.push(request.payload["visa_expiry_date"]);
    }
    if (request.payload["gender"]) {
        cols.push(`gender = $${idx++}`);
        data.push(request.payload["gender"]);
    }
    if (request.payload["nationality"]) {
        cols.push(`nationality = $${idx++}`);
        data.push(request.payload["nationality"]);
    }
    if (request.payload["address_for_foreigners"]) {
        cols.push(`addressForForeigners = $${idx++}`);
        data.push(request.payload["address_for_foreigners"]);
    }
    if (request.payload["purpose_of_visit"]) {
        cols.push(`purposeOfVisit = $${idx++}`);
        data.push(request.payload["purpose_of_visit"]);
    }

    let scols = cols.join(', ')

    let query = `update ${ TABLE.DEPARTURE_CARD } set ${scols} where 1 = 1 and oid = $${idx++}`;
    data.push(request.payload["oid"]);

    let sql = {
        text: query,
        values: data
    }
    try {
        return await Dao.execute_value(request.pg, sql);
    } 
    catch (err) {
        log.error(`An exception occurred while updating: ${err} `)
    }
};


module.exports = save_controller;
