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

const get_list = {
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

        return h.response(response)
    },
};

const handle_request = async (request) => {

}
