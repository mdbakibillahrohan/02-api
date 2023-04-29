"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const query_scheme = Joi.object({

})

const route_controller = {
    method: "GET",
    path: API.CONTEXT + API.MASTER_DASHBOARD_GET_DASHBOARD_INFO_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Master Dashbord Get Dashbord Info",
        plugins: {
            hapiAuthorization: false,
        },
        validate: {
            query: query_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async(request, h, err) => {
                return h.response({
                    code: 400, status: false, message: err?.message
                }).takeover();
            },
        },
    },
    handler: async(request, h) => {
        log.info(`Request received - ${JSON.stringify(request.query)}`);
        const response = await handle_request(request);
        log.debug(`Response sent - ${JSON.stringify(response)}`)
        return h.response(response);
    },
};

const handle_request = async (request) => {
    try {

        let data = [];
        data = await get_data(request);
        
        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_LIST,
            data,
        };
    } catch( err ){
        log.error(`An exception occurred while getting supplier list data: ${err?.message}`);
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
    
    let query = `select count(c.oid) from ${ TABLE.LEDGER } as c where 1 = 1 and c.companyoid = $1`;

    data.push(userInfo.companyoid);
    let idx = 2;
    if (request.query["searchText"]) {
        query += ` and c.name ilike $${idx} or 
            c.ledgerType ilike $${++idx}  `;
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
    let query = `select c.oid, c.name, c.ledgerType, (select coalesce(sum(amount), 0) from ${ TABLE.PAYMENT } where 1 = 1 and status = $1 and referenceOid = c.oid) as balance from ${ TABLE.LEDGER } as c where 1 = 1 and c.companyOid = $2`;
    
    data.push( CONSTANT.ACTIVE ,userInfo.companyoid);
    let idx = 3;
    if (request.query["searchText"]) {
        query += ` and c.name ilike $${idx} or 
            c.ledgerType ilike $${++idx}  `;
        data.push(`% ${request.query["searchText"].trim()} %`)
    }

    query += ` order by p.createdOn desc`;

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
 