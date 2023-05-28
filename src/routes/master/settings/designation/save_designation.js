"use strict";

const Joi = require("@hapi/joi");
const uuid = require('uuid');
const log = require("../../../../util/log");
const Dao = require("../../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../../util/constant");
const { autheticatedUserInfo } = require("../../../../util/helper");

const payload_scheme = Joi.object({
    name_en: Joi.string().trim().min(1).required(),
    name_bn: Joi.string().trim().min(1).required(),
    status: Joi.string().trim().valid("Active", "Inactive").required(),
});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.MASTER_SETTINGS_SAVE_DESIGNATION,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "save setting desgination information",
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
    let save_data_return;
    try {
        save_data_return = await save_data(request);
        if (save_data_return.status) {
            log.info(`Successfully saved`);
            return { status: true, code: 200, message: MESSAGE.SUCCESS_SAVE };
        }
        return { status: false, code: 409, message: save_data_return.message };
    } catch (err) {
        log.error(`An exception occurred while saving settings designation info: ${err}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const save_data = async (request) => {
    try {
        const userInfo = await autheticatedUserInfo(request);
        request.payload.userInfo = userInfo;
        const save_designation = await saveDesignation(request);
        if (!save_designation) {
            return {
                status: false,
                message: "Problem in save designation"
            }
        }
        return {
            status: true
        }
    } catch (error) {
        throw error;
    }

};



const saveDesignation = async (request) => {
    const { name_en, name_bn, status, userInfo } = request.payload;
    let executed;
    let idx = 1;
    let cols = ["oid", "nameEn", "nameBn", "status", "createdBy", "createdOn", "sortOrder", "companyOid"];
    let params = [`$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `$${idx++}`, `(select COALESCE(count(oid), 0) + 1 from ${TABLE.DESIGNATION}  where 1 = 1 and companyOid = $${idx})`, `$${idx++}`];
    const id = uuid.v4();
    let data = [id, name_en, name_bn, status, userInfo.loginid, "now()", userInfo.companyoid]




    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.DESIGNATION} (${scols}) values (${sparams})`;
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
