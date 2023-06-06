"use strict"

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const query_scheme = Joi.object({
    oid: Joi.string().trim().min(1).max(128).required()
});

const route_controller = {
    method: "GET",
    path: API.CONTEXT + API.TICKET_DEPARTURE_CARD_GET_BY_OID_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "ticket departure card get by oid",
        plugins: { hapiAuthorization: false },
        validate: {
            query: query_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 301, status: false, message: err }).takeover();
            },
        },
    },
    handler: async (request, h) => {
        log.debug(`Request received - ${JSON.stringify(request.query)}`);
        const response = await handle_request(request);
        log.debug(`Response sent - ${JSON.stringify(response)}`);
        return h.response(response);
    },
};

const handle_request = async (request) => {
    try {
        let data = await get_data(request);

        log.info(`data found by oid`);
        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_BY_OID,
            data: data
        };
    } catch (err) {
        log.error(err);
    }
}
const get_data = async (request) => {
    const userInfo = await autheticatedUserInfo(request);
    let list_data = [];
    let data = [];

    let query = `select  oid, passengerName as "passenger_name", gender, nationality, passportNumber as "passport_number", flightNumber as "flight_number", addressForForeigners as "address_for_foreigners", visaNumber as "visa_number", visaType as "visa_type", purposeOfVisit as "purpose_of_visit", companyOid as "company_oid", to_char(birthDate, 'YYYY-MM-DD') as "birth_date", to_char(passportExpiryDate, 'YYYY-MM-DD') as "passport_expiry_date", to_char(departureDate, 'YYYY-MM-DD') as "departure_date", to_char(visaExpiryDate, 'YYYY-MM-DD') as "visa_expiry_date" from ${TABLE.DEPARTURE_CARD} where 1 = 1 and oid = $1 and companyoid = $2 `;

    data.push(request.query["oid"], userInfo.companyoid);

    let sql = {
        text: query,
        values: data
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql);
        list_data = data_set.length < 1 ? null : data_set[0];
    } catch (e) {
        log.error(`An exception occurred while getting data by oid: ${e}`);
    }
    return list_data;
}
module.exports = route_controller;