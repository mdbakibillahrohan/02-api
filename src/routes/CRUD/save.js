"use strict";

const Joi = require("@hapi/joi");
const log = require("../../util/log");
const Dao = require("../../util/dao");
const { API, MESSAGE } = require("../../util/constant");

const payload_scheme = Joi.object({
    status: Joi.string().trim().min(1).max(32).required(),
    oid: Joi.string().trim().min(1).max(128).required()
});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + 'save',
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "save",
        plugins: { hapiAuthorization: false },
        validate: {
            payload: payload_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 301, status: false, message: err }).takeover();
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
        await save_data(request);
        log.info(`Successfully saved`);
        return { status: true, code: 200, message: MESSAGE.SUCCESS_SAVE };
    } catch (err) {
        log.error(`An exception occurred while saving: ${err}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const save_data = async (request) => {
    let cols = ['oid', 'createdBy'];
    let params = ['$1', '$2'];
    let data = ['1', request.auth.credentials.userId];
    let idx = 3;
    if (request.payload['status'] == 'Submitted') {
        cols.push('submittedOn');
        params.push(`clock_timestamp()`)
    }
    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into table_name (${scols}) values (${sparams})`;
    let sql = {
        text: query,
        values: data
    }
    await Dao.execute_value(sql)
};


module.exports = save_controller;
