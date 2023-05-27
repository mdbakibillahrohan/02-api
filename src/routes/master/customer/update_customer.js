"use strict";

const Joi = require("@hapi/joi");
const uuid = require('uuid');
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo, passwordGenerator } = require("../../../util/helper");

const payload_scheme = Joi.object({
    oid: Joi.string().trim().min(1).required(),
    name: Joi.string().trim().min(3).max(30).required(),
    address: Joi.string().trim().min(5).max(70).optional(),
    login_id: Joi.string().trim().min(1).optional(),
    mobile_no: Joi.string().trim().min(7).max(15).optional(),
    email: Joi.string().email().optional(),
    initial_balance: Joi.number(),
    discount_type: Joi.string().trim().min(3).max(7),
    discount_value: Joi.number(),
    image_path: Joi.string(),
});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.MASTER_CUSTOMER_UPDATE,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "update customer",
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
        log.error(`An exception occurred while saving: ${err}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const update_data = async (request) => {
    try {
        const userInfo = await autheticatedUserInfo(request);

        // const isDuplicateCustomerDataCount = await is_duplicate_customer_data_count(request, userInfo);
        // if (isDuplicateCustomerDataCount > 0) {
        //     return {
        //         status: false,
        //         message: "Duplicate customer information"
        //     };
        // }

        const saveCustomer = await update_customer(request, userInfo);
        if (saveCustomer) {
            return {
                status: true,
                message: "information successfully updated"
            };
        }

    } catch (error) {
        throw error;
    }

};


const update_customer = async (request, userInfo) => {
    const { oid, mobile_no, name, image_path, email, address, initial_balance, discount_type, discount_value } = request.payload;
    let executed;
    let cols = [`name = $1`, `imagePath = $2`,];
    let data = [name, image_path]

    let idx = 3;
    if (mobile_no) {
        cols.push(`mobileNo = $${idx++}`);
        data.push(mobile_no);
    }

    if (email) {
        cols.push(`email = $${idx++}`);
        data.push(email);
    }

    if (address) {
        cols.push(`address = $${idx++}`);
        data.push(address);
    }


    if (initial_balance) {
        cols.push(`initialBalance = $${idx++}`);
        data.push(initial_balance);
    }



    if (discount_type) {
        cols.push(`discountType = $${idx++}`);
        data.push(discount_type);
    }


    if (discount_value && discount_value > 0) {
        cols.push(`discountValue = $${idx++}`);
        data.push(discount_value);
    }


    let scols = cols.join(', ')
    let query = `update ${TABLE.CUSTOMER} set ${scols} where 1 = 1 and oid = $${idx++}`;
    data.push(oid);
    let sql = {
        text: query,
        values: data
    }
    console.log(sql)
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



module.exports = save_controller;
