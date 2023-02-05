"use strict";

const _ = require("underscore");
const Joi = require("@hapi/joi");
const log = require("../../util/log");
const Dao = require("../../util/dao");
const { API, TABLE, MESSAGE } = require("../../util/constant");

const payload_scheme = Joi.object({
    status: Joi.string().trim().min(1).max(32).required(),
    oid: Joi.string().trim().min(1).max(128).required()
});

const update_controller = {
    method: "POST",
    path: API.CONTEXT + '/update',
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "update",
        plugins: { hapiAuthorization: false },
        validate: {
            payload: payload_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 400, status: false, message: err?.message }).takeover();
            },
        },
    },
    handler: async (request, h) => {
        log.info(`Request received - ${JSON.stringify(request.payload)}`);
        const response = await handle_request(request);
        log.debug(`Response sent - ${JSON.stringify(response)}`);
        return h.response(response);
    },
};

const handle_request = async (request) => {
    try {
        await update_data(request)
        log.info(`Successfully update`);
        return { status: true, code: 200, message: MESSAGE.SUCCESS_SAVE };
    } catch (err) {
        log.error(`An exception occurred while updating: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};


const update_data = async (request) => {
    let data = [request.payload['status'], request.auth.credentials['userId']]
    let query = `update table_name set status = $1, editedby = $2, editedon = clock_timestamp()`
    let idx = 3;
    if (request.payload['status'] == 'Submitted') {
        query += `, submittedOn = clock_timestamp()`
    }
    query += `where oid = $${idx++}`
    data.push(request.payload['oid'])
    let sql = {
        text: query,
        values: data
    }
    await Dao.execute_value(sql)
};

module.exports = update_controller;
