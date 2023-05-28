"use strict";

const Joi = require("@hapi/joi");
const uuid = require('uuid');
const log = require("../../../../util/log");
const Dao = require("../../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../../util/constant");
const { autheticatedUserInfo } = require("../../../../util/helper");

const payload_scheme = Joi.object({
    oid: Joi.string().trim().min(1).required(),
    name_en: Joi.string().trim().min(1).required(),
    name_bn: Joi.string().trim().min(1).required(),
    status: Joi.string().trim().valid("Active", "Inactive").required(),
});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.MASTER_SETTINGS_UPDATE_DESIGNATION,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "update setting designation information",
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
    let update_data_return;
    try {
        update_data_return = await update_data(request);
        if (update_data_return.status) {
            log.info(`Successfully saved`);
            return { status: true, code: 200, message: MESSAGE.SUCCESS_UPDATE };
        }
        return { status: false, code: 409, message: update_data_return.message };
    } catch (err) {
        log.error(`An exception occurred while updating setting designation info: ${err}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const update_data = async (request) => {
    try {
        const userInfo = await autheticatedUserInfo(request);
        request.payload.userInfo = userInfo;
        const update_designation = await updateDesignation(request);
        if (!update_designation) {
            return {
                status: false,
                message: "Problem in update designation"
            }
        }
        return {
            status: true
        }
    } catch (error) {
        throw error;
    }

};



const updateDesignation = async (request) => {
    const { oid, name_en, name_bn, status, userInfo } = request.payload;
    let executed;
    let idx = 1;
    let cols = [`nameEn = $${idx++}`, `nameBn = $${idx++}`, `status = $${idx++}`, `editedBy = $${idx++}`, `editedOn = now()`];

    let data = [name_en, name_bn, status, userInfo.loginid, oid];

    let scols = cols.join(', ')
    let query = `update ${TABLE.DESIGNATION} set ${scols} where 1 = 1 and oid = $${idx++}`;
    let sql = {
        text: query,
        values: data
    }
    try {
        executed = await Dao.execute_value(request.pg, sql);
    } catch (e) {
        throw new Error(e);
    }
    if (executed.rowCount > 0) {
        return true;
    }
    return false;
}





module.exports = save_controller;
