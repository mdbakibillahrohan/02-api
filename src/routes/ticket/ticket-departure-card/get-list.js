"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const query_scheme = Joi.object({
    invoiceNO: Joi.string().trim().allow(null, '').max(128).optional(),
    searchText: Joi.string().trim().allow(null, '').max(128).optional(),
    offset: Joi.number().allow(null, '').max(99999999).optional(),
    limit: Joi.number().allow(null, '').max(99999999).optional(),
})

const route_controller = {
    method: "GET",
    path: API.CONTEXT + API.TICKET_DEPARTURE_CARD_GET_LIST_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Ticket Modification Get List",
        plugins: {
            hapiAuthorization: false,
        },
        validate: {
            query: query_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h.response({
                    code: 400, status: false, message: err
                }).takeover();
            },
        },
    },
    handler: async (request, h) => {
        log.info(`Request received - ${JSON.stringify(request.query)}`);
        const response = await handle_request(request);
        log.debug(`Response sent - ${JSON.stringify(response)}`)
        return h.response(response);
    },
};

const handle_request = async (request) => {
    try {
        let count = await get_count(request);

        let data = [];
        if (count == 0) {
            log.info(MESSAGE.NO_DATA_FOUND);
            return {
                status: false,
                code: 400,
                message: MESSAGE.NO_DATA_FOUND
            };
        }
        data = await get_data(request);
        log.info(`[${count}] found`)

        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_LIST,
            count,
            data,
        };
    } catch (err) {
        log.error(`An exception occurred while getting supplier list data: ${err}`);
        return {
            status: false,
            code: 500,
            message: MESSAGE.INTERNAL_SERVER_ERROR
        };
    }
};
const get_count = async (request) => {
    let userInfo = await autheticatedUserInfo(request)
    let count = 0;
    let data = [];

    let query = `select count(t.oid) from  ${TABLE.TICKET_INVOICE} as t , 
    ${TABLE.CUSTOMER} as c where 1 = 1 and c.oid = t.customerOid and t.companyOid = $1`;

    data.push(userInfo.companyoid);
    let idx = 2;

    if (request.query["searchText"]) {
        query += `and t.invoiceNo ilike ${idx} or 
            t.pnr ilike ${idx} or 
            c.name ilike ${idx++}`;
        data.push(`% ${request.query["searchText"].trim()} %`)
    }
    let sql = {
        text: query,
        values: data
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql);
        count = data_set[0]["count"];
        log.info(count)
    } catch (err) {
        log.error(err)
        throw new Error(err);
    }
    return count;
}
const get_data = async (request) => {
    const userInfo = await autheticatedUserInfo(request);
    let list_data = [];
    let data = [];
    let query = `select  oid, passengerName as "passenger_name", gender, nationality, 
        passportNumber as "passport_number", flightNumber as "flight_number", addressForForeigners as "address_for_foreigners", visaNumber as "visa_number", visaType as "visa_type", purposeOfVisit as "purpose_of_visit", companyOid as "company_oid", to_char(birthDate, 'YYYY-MM-DD') as "birth_date", to_char(passportExpiryDate, 'YYYY-MM-DD') as "passport_expiry_date", to_char(departureDate, 'YYYY-MM-DD') as "departure_date", to_char(visaExpiryDate, 'YYYY-MM-DD') as "visa_expiry_date" from ${TABLE.DEPARTURE_CARD} where 1 = 1 and companyOid = $1`;

    data.push(userInfo.companyoid);
    let idx = 2;


    if (request.query["searchText"]) {
        query += `and t.invoiceNo ilike ${idx} or 
            t.pnr ilike ${idx} or 
            c.name ilike ${idx++}`;
        data.push(`% ${request.query["searchText"].trim()} %`)
    }
    query += ` order by createdOn desc`;

    if (request.query.offset) {
        query += ` offset $${idx++}`;
        data.push(request.query.offset);
    }
    if (request.query.limit) {
        query += ` limit $${idx++}`;
        data.push(request.query.limit)
    }
    let sql = {
        text: query,
        values: data
    }
    try {
        list_data = await Dao.get_data(request.pg, sql);

    } catch (e) {
        throw new Error(e);
    }
    return list_data;
}
module.exports = route_controller;
