"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const query_scheme = Joi.object({
    searchText: Joi.string().trim().allow(null, '').max(128).optional(),
    offset: Joi.number().allow(null,'').max(100000000000).optional(),
    limit: Joi.number().allow(null, '').max(100000000000).optional(),
})

const route_controller = {
    method: "GET",
    path: API.CONTEXT + API.MASTER_GET_SUPPLIER_LIST,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Master Supplier List",
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
        let count = await get_count(request);
        let data = [];
        if (count == 0){
            log.info(MESSAGE.NO_DATA_FOUND);
            return { 
                status: false, 
                code:400,
                message: MESSAGE.NO_DATA_FOUND 
            };
        }
        data = await get_data(request);
        log.info(`[${count}] found`)
        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_LIST,
            data: data,
            count: count
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
   let count = 0;
   let data = [];
   let query = `select count(*) `
}
module.exports = route_controller;
 