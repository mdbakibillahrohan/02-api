"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE } = require("../../../util/constant");

const query_scheme = Joi.object({});

const get_list = {
    method: "GET",
    path: API.CONTEXT + API.MASTER_INQUIRY_GET_AIRLINE_LIST,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Inquiry airline list",
        plugins: { hapiAuthorization: false },
        validate: {
            query: query_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 400, status: false, message: err?.message }).takeover();
            },
        },
    },
    handler: async (request, h) => {
        log.info(`Request received - ${JSON.stringify(request.query)}`);
        const response = await handle_request(request);
        log.debug(`Response sent - ${JSON.stringify(response)}`);
        return h.response(response);
    },
};

const handle_request = async (request) => {
    try {

        let data = [];
        data = await get_data(request)
        log.info(`inquiry arline info found`);
        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_LIST,
            data: data,
        };
    } catch (err) {
        log.error(`An exception occurred while getting inquiry airline list data : ${err?.message}`);
        return {
            status: false,
            code: 500,
            message: MESSAGE.INTERNAL_SERVER_ERROR
        };
    }
};



const get_data = async (request) => {
    let list_data = [];
    let data = [];
    let query = `select oid, airlineId, airlineName, aliasName, country, iata, icao, callsign, status, country || '-' || airlineName || '-' || iata as airlineDetails from ${TABLE.AIRLINE} where 1 = 1 order by airlinename desc`;

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
};

module.exports = get_list;