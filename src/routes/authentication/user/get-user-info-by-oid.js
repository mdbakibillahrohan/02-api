"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, TABLE, MESSAGE } = require("../../../util/constant");

const query_scheme = Joi.object({
    oid: Joi.string().trim().min(1).max(128).required()
});

const get_by_oid = {
    method: "GET",
    path: API.CONTEXT + API.AUTHENTICATION_USER_GET_USER_INFO_BY_OID_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "get by oid",
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
        let data = await get_data(request);
        log.info(`data found by oid`);
        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_BY_OID,
            data: data
        };
    } catch (err) {
        log.error(err?.message);
    }
};

const get_data = async (request) => {
    let data = null, query = null;
    query = `select l.oid, l.loginId as login_id, l.password, l.name, l.status, 
        l.mobileNo as mobile_no, l.address, l.email, l.menuJson as menu_json, 
        l.reportJson as report_json, l.imagePath as image_path from
        ${ TABLE.LOGIN } as l where 1 = 1 and l.oid = $1`;
    let sql = {
        text: query,
        values: [request.query.oid]
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql);
        data = data_set.length < 1 ? null : data_set[0];
    } catch (e) {
        log.error(`An exception occurred while getting data by oid: ${e?.message}`);
    }
    return data;
};

module.exports = get_by_oid;
