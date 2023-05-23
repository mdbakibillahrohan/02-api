"use strict";

const _ = require("underscore");
const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, TABLE, MESSAGE } = require("../../../util/constant");

const payload_scheme = Joi.object({
    password: Joi.string().trim().min(1).max(128).required(),
    oid: Joi.string().trim().min(1).max(128).required(),
});

const update_controller = {
    method: "POST",
    path: API.CONTEXT + API.AUTHENTICATION_USER_RESET_PASSWORD_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Reset password",
        plugins: { hapiAuthorization: false },
        validate: {
            payload: payload_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h
                    .response({ code: 400, status: false, message: err?.message })
                    .takeover();
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
        
        const update = await update_data(request);
        if (update["rowCount"] == 1){
            log.info(`Successfully update`);
            return { status: true, code: 200, message: MESSAGE.SUCCESS_UPDATE };
        }
        else {
            log.info(`Already update`);
            return { status: true, code: 204, message: MESSAGE.ALREADY_UPDATE };
        }

    } catch (err) {
        log.error(`An exception occurred while updating: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const update_data = async (request) => {
    const cols = ['password = $1']
    let data = [request.payload["password"]];

    let sCols = cols.join(', ')
    let query = `update ${ TABLE.LOGIN } set ${ sCols } where 1 = 1 and oid = $2`;

    data.push(request.payload["oid"]);
    let sql = {
        text: query,
        values: data,
    };
    try {

        return await Dao.execute_value(sql);
    } 
    catch (err) {
        log.error("an exception occurred while update :",err?.message)
    }
};

module.exports = update_controller;
