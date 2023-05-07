"use strict"

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const query_scheme = Joi.object({
    fromDate: Joi.date().required(),
    toDate: Joi.date().required(),

});

const route_controller = {
    method: "GET",
    path: API.CONTEXT + API.TICKET_DASHBOARD_GET_DASHBOARD_INFO_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "get ticket dashboard data",
        plugins: { hapiAuthorization: false },
        validate: {
            query: query_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 301, status: false, message: err?.message }).takeover();
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

        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_BY_OID,

        };
    } catch (err) {
        log.error(err?.message);
    }
}
const getSalesAmount = async (userInfo, request) => {
    let list_data = [];
    let data = [];
    
    let query = `select coalesce(sum(netsalesprice), 0) from ${ TABLE.TICKET_INVOICE }
     where 1 = 1 and companyOid = $1 and status = $1 and invoiceDate between ${ request.query['fromDate'] } and
     ${ request.query['toDate'] } `;

    data.push(userInfo.companyoid, CONSTANT.ACTIVE)
    let sql = {
        text: query,
        values: data
    }
    try{
        list_data = await Dao.get_data(request.pg, sql);

    }
    catch(err) {
        throw new Error(e);
    }
}

module.exports = route_controller;