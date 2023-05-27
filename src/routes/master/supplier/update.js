"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const uuid = require('uuid');
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const payload_scheme = Joi.object({
    oid: Joi.string().trim().min(1).max(128).required(),

    customerId: Joi.string().trim().min(1).max(128).optional(),
    name: Joi.string().trim().min(1).max(128).optional(),
    imagePath: Joi.string().trim().min(1).max(256).optional(),
    mobileNo: Joi.string().trim().min(1).max(128).optional(),
    email: Joi.string().trim().email().optional(),

    status: Joi.string().trim().min(1).max(32).optional(),
    address: Joi.string().trim().min(1).max(128).optional(),
    initialBalance: Joi.number().optional(),
    commissionType: Joi.string().trim().min(1).max(128).optional(),
    commissionValue: Joi.number().optional(),
    supplierType: Joi.string().trim().min(1).max(128).optional(),
    serviceCharge: Joi.number().optional(),

    emailService: Joi.array().items({
        oid: Joi.string().trim().min(1).max(128).required(),
        serviceType: Joi.string().trim().min(1).max(128).optional(),
        toEmailAddrees: Joi.string().trim().min(1).max(128).optional(),
        toCCEmailAddrees: Joi.string().trim().min(1).max(128).optional(),
        contactNo: Joi.string().trim().min(1).max(128).optional(),
        remarks: Joi.string().trim().optional(),
    }
    )
});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.MASTER_SUPPLIER_UPDATE_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "supplier update",
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
        let update = await update_data(request);

        if (update.updateDataRow < 1 || update.updateEmailServiceRow < 1) {
            return { status: false, code: 400, message: MESSAGE.USER_NOT_EXIST };
        } else if (update.updateDataRow == 1 || update.updateEmailServiceRow == 1) {
            log.info(`Successfully Update`);
            return { status: true, code: 200, message: MESSAGE.SUCCESS_UPDATE };
        }
        else {
            return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
        }

    } catch (err) {
        log.error(`An exception occurred while updating: ${err}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};
const update_data = async (request) => {
    try {
        const userInfo = await autheticatedUserInfo(request);

        let updateData = await update(userInfo, request)

        let updateEmailService = null
        if (request.payload["emailService"]) {
            request.payload["emailService"].forEach(async email => {

                updateEmailService = await updateSupplierEmailService(userInfo, email, request)

            });
        }
        let output = {
            updateDataRow: updateData["rowCount"],

        }
        if (updateEmailService == null) {
            return {
                updateDataRow: updateData["rowCount"],

            }
        }
        return {
            updateDataRow: updateData["rowCount"],
            updateEmailServiceRow: updateEmailService["rowCount"]
        }

    } catch (err) {
        log.error(`${err}`)
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
}
const update = async (userInfo, request) => {

    let cols = [];
    let data = [];
    let idx = 1;
    if (request.payload["name"]) {
        cols.push(`name = $${idx++}`)
        data.push(request.payload["name"])
    }
    if (request.payload["imagePath"]) {
        cols.push(`imagePath = $${idx++}`)
        data.push(request.payload["imagePath"])
    }
    if (request.payload['customerId']) {
        cols.push(`customerId = $${idx++}`)
        data.push(request.payload["customerId"])
    }
    if (request.payload["mobileNo"]) {
        cols.push(`mobileNo = $${idx++}`);
        data.push(request.payload["mobileNo"]);

    }
    if (request.payload["email"]) {
        cols.push(`email = $${idx++}`);
        data.push(request.payload["email"]);
    }
    if (request.payload["address"]) {
        cols.push(`address = $${idx++}`);
        data.push(request.payload["address"]);
    }
    if (request.payload["initialBalance"]) {
        cols.push(`initialBalance = $${idx++}`);
        data.push(request.payload["initialBalance"]);
    }
    if (request.payload["commissionType"]) {
        cols.push(`commissionType = $${idx++}`);
        data.push(request.payload["commissionType"]);
    }
    if (request.payload["commissionValue"]) {
        cols.push(`commissionValue = $${idx++}`);
        data.push(request.payload["commissionValue"]);
    }
    if (request.payload["supplierType"]) {
        cols.push(`supplierType = $${idx++}`);
        data.push(request.payload["supplierType"]);
    }
    if (request.payload["serviceCharge"] >= 0) {
        cols.push(`serviceCharge = $${idx++}`);
        data.push(request.payload["serviceCharge"]);
    }

    if (request.payload['status'] == 'Submitted') {
        cols.push('submittedOn');
        params.push(`clock_timestamp()`)
    }
    let sCols = cols.join(', ')

    let query = `UPDATE ${TABLE.SUPPLIER} set ${sCols} where 1 = 1 and oid = '${request.payload["oid"]}' and companyOid = '${userInfo.companyoid}'`;

    let sql = {
        text: query,
        values: data
    }
    try {
        return await Dao.execute_value(request.pg, sql);

    } catch (err) {
        log.error(`An exception occurred while updating supplier: ${err}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }

};

const updateSupplierEmailService = async (userInfo, email, request) => {
    let cols = [];
    let data = [];

    let idx = 1;

    if (email["serviceType"]) {
        cols.push(`serviceType = $${idx++}`);
        data.push(email["serviceType"]);
    }
    if (email["toEmailAddrees"]) {
        cols.push(`toEmailAddrees = $${idx++}`);
        data.push(email["toEmailAddrees"]);
    }
    if (email["toCCEmailAddrees"]) {
        cols.push(`toCCEmailAddrees = $${idx++}`);
        data.push(email["toCCEmailAddrees"]);
    }
    if (email["contactNo"]) {
        cols.push(`contactNo = $${idx++}`);
        data.push(email["contactNo"]);
    }
    if (email["remarks"]) {
        cols.push(`remarks = $${idx++}`);
        data.push(email["remarks"]);
    }

    let scols = cols.join(', ')

    let query = `update ${TABLE.SUPPLIER_EMAIL_SERVICE} set (${scols}) where 1 = 1 and oid = ${email.oid} and supplieroid = '${request.payload[oid]}' and companyoid = '${userInfo.companyoid}'`;

    let sql = {
        text: query,
        values: data
    }
    try {
        return await Dao.execute_value(request.pg, sql);
    } catch (err) {
        log.error(`An exception occurred while updating supplierEmailService: ${err}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }

}

module.exports = save_controller;
