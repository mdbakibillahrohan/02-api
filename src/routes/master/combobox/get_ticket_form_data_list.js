"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const query_scheme = Joi.object({});

const get_list = {
    method: "GET",
    path: API.CONTEXT + API.COMBOBOX_GET_TICKET_FORM_DATA_LIST,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Combobox ticket form data list",
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
        const customer_data = await get_customer_data(request);
        const supplier_data = await get_supplier_data(request);
        log.info(`data found`);
        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_LIST,
            data: {
                customer_list: customer_data,
                supplier_list: supplier_data
            },
        };
    } catch (err) {
        log.error(`An exception occurred while getting ticket form data list : ${err?.message}`);
        return {
            status: false,
            code: 500,
            message: MESSAGE.INTERNAL_SERVER_ERROR
        };
    }
};



const get_supplier_data = async (request) => {
    const userInfo = await autheticatedUserInfo(request);
    let list_data = [];
    let data = [];
    let query = `select oid, name, mobileNo, commissionType, commissionValue, serviceCharge  from ${TABLE.SUPPLIER} where 1 = 1`;
    let idx = 1;
    query += ` and companyoid = $${idx}`;
    idx++;
    data.push(userInfo.companyoid);
    query += ` order by createdon desc`;

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
const get_customer_data = async (request) => {
    const userInfo = await autheticatedUserInfo(request);
    let list_data = [];
    let data = [];
    let query = `select oid, name, mobileNo, discountType, discountValue from ${TABLE.CUSTOMER} where 1 = 1`;
    let idx = 1;
    query += ` and companyoid = $${idx}`;
    idx++;
    data.push(userInfo.companyoid);
    query += ` order by createdon desc`;

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
const get_airport_data = async (request) => {
    const userInfo = await autheticatedUserInfo(request);
    let list_data = [];
    let data = [];
    let query = `select oid, iata, icao, country || '-' || city || '-' || airportName || '-' || iata as airportDetails from ${TABLE.AIRPORT} where 1 = 1`;
    let idx = 1;
    query += ` and companyoid = $${idx}`;
    idx++;
    data.push(userInfo.companyoid);
    query += ` order by airportName desc`;

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
const get_airlines_data = async (request) => {
    const userInfo = await autheticatedUserInfo(request);
    let list_data = [];
    let data = [];
    let query = `select oid, iata, icao, country || '-' || airlineName || '-' || iata as airlineDetails from ${TABLE.AIRLINE} where 1 = 1`;
    let idx = 1;
    query += ` and companyoid = $${idx}`;
    idx++;
    data.push(userInfo.companyoid);
    query += ` order by airlineName desc`;

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
