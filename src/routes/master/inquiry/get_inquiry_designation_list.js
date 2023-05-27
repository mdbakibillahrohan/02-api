"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const query_scheme = Joi.object({});

const get_list = {
    method: "GET",
    path: API.CONTEXT + API.MASTER_INQUIRY_GET_DESIGNATION_LIST,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Inquiry designation list",
        plugins: { hapiAuthorization: false },
        validate: {
            query: query_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 400, status: false, message: err }).takeover();
            },
        },
    },
    handler: async (request, h) => {
        log.info(`Request received - ${JSON.stringify(request.query)}`);
        const response = await handle_request(request);
        log.debug(`Response sent - ${JSON.stringify(response)}`);
        return h.response(response);
    },
};

const handle_request = async (request) => {
    try {

        let data = [];
        data = await get_data(request)
        log.info(`inquiry designation info found`);
        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_LIST,
            data: data,
        };
    } catch (err) {
        log.error(`An exception occurred while getting inquiry designation list data : ${err}`);
        return {
            status: false,
            code: 500,
            message: MESSAGE.INTERNAL_SERVER_ERROR
        };
    }
};



const get_data = async (request) => {
    const userInfo = await autheticatedUserInfo(request)
    let list_data = [];
    let data = [userInfo.companyoid, CONSTANT.ACTIVE];
    let query = `select oid, nameEn, nameBn from ${TABLE.DEPARTMENT} where 1 = 1 and companyOid = $1 and status = $2 order by sortOrder asc`;

    let sql = {
        text: query,
        values: data
    }
    try {
        list_data = await Dao.get_data(request.pg, sql);
    } catch (e) {
        throw new Error(e);
    }
    return list_data;
};

module.exports = get_list;
