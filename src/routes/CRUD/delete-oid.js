"use strict";

const Joi = require("@hapi/joi");
const log = require("../../util/log");
const Dao = require("../../util/dao");
const { API, TABLE, MESSAGE } = require("../../util/constant");

const query_scheme = Joi.object({
    oid: Joi.string().trim().min(1).max(128).required()
});

const delete_by_oid = {
    method: "GET",
    path: API.CONTEXT + 'delete-by-oid',
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "delete by oid",
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
        await delete_data(request);
        log.info(`delete data by oid`);
        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_delete_BY_OID,
            data: data
        };
    } catch (err) {
        log.error(err?.message);
    }
};

const delete_data = async (request) => {
    let sql = {
        text: `delete from table_name where 1 = 1 and oid = $1`,
        values: [request.query.oid]
    }
    try {
        await Dao.execute_value(sql)
    } catch (e) {
        log.error(`An exception occurred while removing data by oid: ${e?.message}`);
    }
    return data;
};

module.exports = delete_by_oid;
