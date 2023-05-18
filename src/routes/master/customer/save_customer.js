"use strict";

const Joi = require("@hapi/joi");
const uuid = require('uuid');
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const payload_scheme = Joi.object({
    name: Joi.string().trim().min(3).max(30).required(),
    login_id: Joi.string().trim().min(5).max(30).required(),
    customer_id: Joi.string().trim().required(),
    address: Joi.string().trim().min(5).max(70).required(),
    mobile_no: Joi.string().trim().min(7).max(15).required(),
    email: Joi.string().email().required(),
    initial_balance: Joi.number(),
    discount_type: Joi.string().trim().min(3).max(3),
    discount_value: Joi.number(),
    image_path: Joi.string(),
    status: Joi.string(),
});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.MASTER_CUSTOMER_SAVE,
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
    const userInfo = autheticatedUserInfo(request);
    let cols = ['oid', 'createdBy'];
    let params = ['$1', '$2'];
    let data = ['1', request.auth.credentials.userId];
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


const save_customer = async (request) => {
    const { customer_id, mobile_no, name, image_path, email, address, initial_balance, discount_type, discount_value } = request.payload;
    let executed;
    let cols = ["oid", "customerId", "name", "imagePath", "companyOid", "mobileNo", "email", "address", "initialBalance", "discountType", "discountValue"];
    let params = []
}

const customer_login_info_save = async (request, userInfo) => {
    const { name, password, image_path, mobile_no, login_id } = request.payload;
    let executed;
    let cols = ['oid', 'loginId', 'name', 'password', 'imagePath', 'menuJson', 'reportJson', 'status', 'roleOid', 'mobileNumber'];
    let params = ['$1', '$2', '$3', '$4', '$5', `(select menuJson from ${TABLE.ROLE} where oid = $6)`, `(select reportJson from ${TABLE.ROLE} where oid = $6)`, '$7', '$6', '$8']
    const id = uuid.v4();
    let data = [id, login_id, name, password, image_path, CONSTANT.CUSTOMER, CONSTANT.ACTIVE, mobile_no];
    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into table_name (${scols}) values (${sparams})`;
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

const count = async (request, userInfo) => {
    const { mobile_no } = request.payload;
    let count = 0;

    const query = `select count(*) as total from ${TABLE.LOGIN} where mobileno = $1 and companyoid = $2`;
    let data = [mobile_no, userInfo.companyoid]
    let sql = {
        text: query,
        values: data
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql);
        count = data_set[0]["total"];
    } catch (e) {
        throw new Error(e);
    }
    return count;
}

module.exports = save_controller;
