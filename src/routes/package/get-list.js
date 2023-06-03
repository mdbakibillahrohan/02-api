"use strict"

const log = require("../../util/log")
const Dao = require("../../util/dao")
const Helper = require("../../util/helper")
const { API, TABLE , MESSAGE} = require("../../util/constant")
const { autheticatedUserInfo } = require("../../util/helper");


const route_controller = {
    method: "GET",
    path: API.CONTEXT + API.PACKAGE_GET_LIST_PATH,
    options: {
        auth: false,
        description: "get list",
        plugins: { hapiAuthorization: false },
        validate: {
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 400, status: false, message: err?.message }).takeover();
            },
        },
    },
    handler: async (request, h) => {
        log.debug(`Request received - ${JSON.stringify(request.payload)}`)
        const response = await handle_request(request)
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

    let list_data = [];

    let query = `select oid, name, packagejson, price, description, period from ${ TABLE.PACKAGE } `;

    let sql = {
        text: query,
        values: []
    }
    try {
        list_data = await Dao.get_data(request.pg, sql);
    } catch (e) {
        throw new Error(e);
    }
    return list_data;
}


module.exports = route_controller
