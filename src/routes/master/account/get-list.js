"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const query_scheme = Joi.object({

    offset: Joi.number().allow(null, '').max(100000000000).optional(),
    limit: Joi.number().allow(null, '').max(100000000000).optional(),
})

const route_controller = {
    method: "GET",
    path: API.CONTEXT + API.MASTER_ACCOUNT_GET_LIST_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Master Account List",
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
                    code: 400, status: false, message: err?.message
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
            data,
            count
        };
    } catch (err) {
        log.error(`An exception occurred while getting Transaction list data: ${err?.message}`);
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

    let query = `select count(oid) from ${TABLE.ACCOUNT} where 1 = 1 
    and companyOid = $1`;

    data.push(userInfo.companyoid);

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

    let query = `select oid, name, accountNumber as "account_number", accountType as "account_type", initialBalance as "initial_balance", account_balance(oid) as "balance" from ${TABLE.ACCOUNT} where 1 = 1 and companyOid = $1`;


    data.push(userInfo.companyoid);

    query += ` order by createdOn desc`;
    let idx = 2;

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
