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
    method: "get",
    path: API.CONTEXT+ `file`,

    options: {
        auth: false,
        description: "image upload",
        plugins: { hapiAuthorization: false },

    },
    handler: async (request, h) => {
        console.log("image call")
        return h.file('../../public/upload/file.js')
    },
};

const handle_request = async (request) => {
    try {
        await save_data(request);
        log.info(`Successfully saved`);
        return { status: true, code: 200, message: MESSAGE.SUCCESS_SAVE };
    } catch (err) {
        log.error(`An exception occurred while saving: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const save_data = async (request) => {
    console.log(request.payload)
};


module.exports = save_controller;
