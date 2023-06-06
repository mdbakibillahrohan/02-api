"use strict";

const Joi = require("joi");
// const fs = require('fs');
const concat = require('concat-stream')
const log = require("../../util/log");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../util/constant");
const { autheticatedUserInfo } = require("../../util/helper");


const payload_scheme = Joi.object({
    file: Joi.string().optional(),
})


const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.IMAGE_UPLOAD_PARH,

    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "image upload",
        plugins: { hapiAuthorization: false },
        validate: {
            payload: payload_scheme
            ,
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
    console.log(request.payload)
};


module.exports = save_controller;
