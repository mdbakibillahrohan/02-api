"use strict";

const Joi = require("@hapi/joi");
const uuid = require('uuid');
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo, passwordGenerator } = require("../../../util/helper");

const payload_scheme = Joi.object({
    name: Joi.string().trim().min(3).max(30).required(),
    address: Joi.string().trim().min(5).max(70).optional(),
    login_id: Joi.string().trim().min(1).optional(),
    mobile_no: Joi.string().trim().min(7).max(15).optional(),
    email: Joi.string().email().optional(),
    initial_balance: Joi.number(),
    discount_type: Joi.string().trim().min(3).max(7),
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
        description: "save customer",
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
    let save_data_return;
    try {
        save_data_return = await save_data(request);
        if (save_data_return.status) {
            log.info(`Successfully saved`);
            return { status: true, code: 200, message: MESSAGE.SUCCESS_SAVE };
        }
        return { status: false, code: 409, message: save_data_return.message };
    } catch (err) {
        log.error(`An exception occurred while saving: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const save_data = async (request) => {
    try {
        const userInfo = await autheticatedUserInfo(request);
        const allCustomerCount = await customer_data_count(request, userInfo);
        const customerId = `C-${allCustomerCount + 1}`;
        const password = passwordGenerator(6, true, true);
        let login_id;
        if (request.payload.login_id) {
            login_id = request.payload.login_id;
        } else {
            login_id = request.payload.email;
        }
        request.payload.customer_id = customerId;
        request.payload.login_id = login_id;
        request.payload.password = password;
        const loginDataCount = await login_count(request, userInfo);
        if (loginDataCount > 0) {
            return {
                status: false,
                message: "Duplicate login information"
            };
        }
        const isDuplicateCustomerDataCount = await is_duplicate_customer_data_count(request, userInfo);
        if (isDuplicateCustomerDataCount > 0) {
            return {
                status: false,
                message: "Duplicate customer information"
            };
        }

        const saveCustomer = await save_customer(request, userInfo);
        const saveLoginInfo = await customer_login_info_save(request, userInfo);
        if (saveCustomer && saveLoginInfo) {
            return {
                status: true,
                message: "information successfully saved"
            };
        }

    } catch (error) {
        throw error;
    }

};


const save_customer = async (request, userInfo) => {
    const { customer_id, mobile_no, name, image_path, email, address, initial_balance, discount_type, discount_value } = request.payload;
    let executed;
    let cols = ["oid", "customerId", "name", "imagePath", "companyOid"];
    let params = ['$1', '$2', '$3', '$4', '$5'];
    let idx = 6;
    const id = uuid.v4()
    let data = [id, customer_id, name, image_path, userInfo.companyoid]


    if (mobile_no) {
        cols.push("mobileNo");
        params.push(`$${idx++}`);
        data.push(mobile_no);
    }

    if (email) {
        cols.push("email");
        params.push(`$${idx++}`);
        data.push(email);
    }

    if (address) {
        cols.push("address");
        params.push(`$${idx++}`);
        data.push(address);
    }


    if (initial_balance) {
        cols.push("initialBalance");
        params.push(`$${idx++}`);
        data.push(initial_balance);
    }



    if (discount_type) {
        cols.push("discountType");
        params.push(`$${idx++}`);
        data.push(discount_type);
    }


    if (discount_value) {
        cols.push("discountValue");
        params.push(`$${idx++}`);
        data.push(discount_value);
    }


    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.CUSTOMER} (${scols}) values (${sparams})`;
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

const customer_login_info_save = async (request, userInfo) => {
    const { name, password, image_path, mobile_no, login_id, email, address, reference_type, reference_oid } = request.payload;
    let executed;
    let cols = ['oid', 'loginId', 'name', 'password', 'imagePath', 'menuJson', 'reportJson', 'status', 'roleOid', 'companyOid'];
    let params = ['$1', '$2', '$3', '$4', '$5', `(select menuJson from ${TABLE.ROLE} where oid = $6)`, `(select reportJson from ${TABLE.ROLE} where oid = $6)`, '$7', '$6', '$8'];
    let idx = 9;
    const id = uuid.v4();
    let data = [id, login_id, name, password, image_path, CONSTANT.ROLE_OID_CUSTOMER, CONSTANT.ACTIVE, userInfo.companyoid];

    if (mobile_no) {
        cols.push("mobileNo");
        params.push(`$${idx++}`);
        data.push(mobile_no);
    }

    if (email) {
        cols.push("email");
        params.push(`$${idx++}`);
        data.push(email);
    }

    if (address) {
        cols.push("address");
        params.push(`$${idx++}`);
        data.push(address);
    }
    if (reference_type) {
        cols.push("referenceType");
        params.push(`$${idx++}`);
        data.push(reference_type);
    }
    if (reference_oid) {
        cols.push("referenceOid");
        params.push(`$${idx++}`);
        data.push(reference_oid);
    }

    console.log(params)
    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.LOGIN} (${scols}) values (${sparams})`;
    let sql = {
        text: query,
        values: data
    }
    console.log("login info save ", sql);
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

const login_count = async (request, userInfo) => {
    const { mobile_no } = request.payload;
    let count = 0;

    const query = `select count(*) as total from ${TABLE.LOGIN} where mobileno = $1 and companyoid = $2`;
    let data = [mobile_no, userInfo.companyoid]
    let sql = {
        text: query,
        values: data
    }
    console.log("duplicatate login", query)
    console.log("duplicatate login", data)
    try {
        let data_set = await Dao.get_data(request.pg, sql);
        count = data_set[0]["total"];
    } catch (e) {
        throw new Error(e);
    }
    return count;
}

const is_duplicate_customer_data_count = async (request, userInfo) => {
    const { mobile_no } = request.payload;
    let count = 0;

    const query = `select count(*) as total from ${TABLE.CUSTOMER} where mobileno = $1 and companyoid = $2`;
    let data = [mobile_no, userInfo.companyoid]
    console.log("duplicatate customer", query)
    console.log("duplicatate customer", data)
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

const customer_data_count = async (request, userInfo) => {
    let count = 0;

    const query = `select count(oid) as total from ${TABLE.CUSTOMER}`;
    let data = []
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
