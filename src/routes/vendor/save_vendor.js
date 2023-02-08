"use strict";

const Joi = require("@hapi/joi");
const log = require("../../util/log");
const Dao = require("../../util/dao");
const Helper = require("../../util/helper")
const uuid = require('uuid');
const { API, MESSAGE, TABLE } = require("../../util/constant");

const payload_scheme = Joi.object({
    name: Joi.string().trim().min(3).max(30).required(),
    address: Joi.string().trim().min(5).max(70),
    mobile_no: Joi.string().trim().min(7).max(15),
    email: Joi.string().email(),
    supplier_type: Joi.string(),
    initial_balance: Joi.number(),
    commission_type: Joi.string(),
    commisssion_value: Joi.number(),
    service_charge: Joi.number(),
    image_path: Joi.string().max(256),
    status: Joi.string(),
});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.SAVE_VENDOR,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Save Vendor",
        plugins: { hapiAuthorization: false },
        validate: {
            payload: payload_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 301, status: false, message: err?.message }).takeover();
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
        log.error(`An exception occurred while saving: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const save_data = async (request) => {
    const { name, address, mobile_no, email, supplier_type, initial_balance, commission_type, commisssion_value, service_charge, image_path, status } = request.payload;

    const userInfo = await Helper.autheticatedUserInfo(request);
    const id = uuid.v4();
    let cols = ['oid', 'name', 'address', 'mobileno', 'email', 'suppliertype', 'initialbalance', 'commissiontype', 'commissionvalue', 'servicecharge', 'imagepath', 'status', 'createdby', 'createdon', 'companyoid'];
    let params = ['$1', '$2', '$3', '$4', '$5', '$6', '$7', '$8', '$9', '$10', '$11', '$12', '$13', 'clock_timestamp()', '$14',];
    let data = [id, name, address, mobile_no, email, supplier_type, initial_balance, commission_type, commisssion_value, service_charge, image_path, status, userInfo.oid, userInfo.companyoid];

    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.VENDOR} (${scols}) values (${sparams})`;
    let sql = {
        text: query,
        values: data
    }
    await Dao.execute_value(request.pg, sql)
};


module.exports = save_controller;
