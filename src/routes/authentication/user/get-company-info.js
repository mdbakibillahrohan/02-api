"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const query_schema = Joi.object({
    oid: Joi.string().trim().min(1).max(128).optional()
})
const route_controller = {
    method: "GET",
    path: API.CONTEXT + API.AUTHENTICATION_USER_GET_COMPANY_INFO,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Get company info",
        plugins: { hapiAuthorization: false },
        validate: {
            query: query_schema,
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 301, status: false, message: err?.message }).takeover()
            },
        },
    },
    handler: async (request, h) => {
        log.debug(`Request received - ${JSON.stringify(request.payload)}`)
        const response = await handle_request(request, h)
        log.debug(`Response sent - ${JSON.stringify(response)}`)
        return h.response(response)
    }
}

const handle_request = async (request) => {
    let data = await get_data(request)
    if (!data) {
        log.info(`User data not found`)
        return { status: true, code: 201, message:  MESSAGE.NO_DATA_FOUND}
    }
    log.info(`User data found`)
    return { status: true, code: 200, data: data }
}

const get_data = async (request) => {
    let userInfo = await autheticatedUserInfo(request)
    let list_data = [];

    let query = `select c.oid, c.name, c.mnemonic, c.businessType as business_type,
        c.address, c.website, c.telephone, c.contactNo as contact_no, 
        c.hotlineNumber as hotline_number, c.logoPath  as logo_path
        from ${ TABLE.COMPANY } as c where 1 = 1 and c.oid = $1`;

    let sql = {
        text: query,
        values: [request.query.oid]
    }
    try {
        list_data = await Dao.get_data(request.pg, sql);
    } catch (e) {
        throw new Error(e);
    }
    return list_data;
}


module.exports = route_controller
