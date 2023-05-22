"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE } = require("../../../util/constant");

const query_scheme = Joi.object({
    searchText: Joi.string().trim().allow(null, '').max(128).optional(),
    companyOid: Joi.string().trim().min(1).max(128).optional(),
    offset: Joi.number().allow(null, '').max(99999999).optional(),
    limit: Joi.number().allow(null, '').max(99999999).optional(),
});

const get_list = {
    method: "GET",
    path: API.CONTEXT + API.AUTHENTICATION_USER_GET_LIST,
    options: {

        description: "get list",
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

        let count = await get_count(request);
        let data = [];
        if (count == 0) {
            log.info(`No data found`);
            return { status: false, code: 400, message: `No data found` };
        }
        data = await get_data(request)
        log.info(`[${count}] found`);
        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_LIST,
            data: data,
            count: count
        };
    } catch (err) {
        log.error(`An exception occurred while getting list data : ${err?.message}`);
        return {
            status: false,
            code: 500,
            message: MESSAGE.INTERNAL_SERVER_ERROR
        };
    }
};

const get_count = async (request) => {
    let count = 0;
    let data = [];
    let query = `select count(l.oid) from  ${ TABLE.LOGIN } as l
        left join ${ TABLE.ROLE } as r on r.oid = l.roleOid where 1 = 1`;
    let idx = 1;
    if (request.query["companyOid"]) {
        query += ` and companyOid = $${idx++}`;
        data.push(request.query.companyOid)
    }
    if (request.query['searchText']) {
        query += ` and l.loginId ilike $${idx} or 
            l.name ilike $${idx} or l.mobileNo ilike $${idx++} or 
            l.email ilike $${idx} `;

        data.push(`% ${request.query["searchText"].trim()} %`)
    }
    let sql = {
        text: query,
        values: data
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql);
        count = data_set[0]["total"];
    } catch (e) {
        throw new Error(e);
    }
    return count;
};

const get_data = async (request) => {
    let list_data = [];
    let data = [];
    let query = `select l.oid, l.loginId, l.mobileNo, l.name, 
        l.email, l.status, r.roleId from ${ TABLE.LOGIN } as l
        left join ${ TABLE.ROLE } as r on r.oid = l.roleOid
        where 1 = 1`;
    let idx = 1;
    if (request.query['companyOid']) {
        query += ` and companyOid = $${idx++}`;
        data.push(request.query['companyOid'])
    }
    if (request.query['searchText']) {
        query += ` and l.loginId ilike $${idx} or 
            l.name ilike $${idx} or l.mobileNo ilike $${idx++} or 
            l.email ilike $${idx} `;

        data.push(`% ${request.query["searchText"].trim()} %`)
    }
    if (request.query.offset) {
        query += ` offset $${idx++}`;
        data.push(request.query.offset);
    }
    if (request.query.limit) {
        query += ` limit $${idx++}`;
        data.push(request.query.limit);
    }

    query += ` order by createdOn asc`
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
