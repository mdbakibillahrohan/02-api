"use strict"

const _ = require("underscore")
const log = require("../../util/log")
const Dao = require("../../util/dao")
const Helper = require("../../util/helper")
const { API, TABLE, SCHEMA } = require("../../util/constant")

const route_controller = {
    method: "GET",
    path: API.CONTEXT + API.SIGN_OUT,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Sign out user",
        plugins: {
            hapiAuthorization: {
                validateEntityAcl: true,
                validateAclMethod: 'isGranted',
                aclQuery: async (id, request) => {
                    return {
                        isGranted: async (user, role) => {
                            return await Helper.is_granted(request, API.SIGN_OUT)
                        }
                    }
                }
            }
        },
        validate: {
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 301, status: false, message: err }).takeover()
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
    let token = (request.headers.authorization).split(" ")[1]
    const api_json = JSON.parse(await Dao.get_value(request.redis_wdb, token))
    if (api_json == null) {
        log.warn(`[${request.auth.credentials["client_id"]}] - invalid token`)
        return { status: false, code: 201, message: "Invalid token" }
    }
    await update_data(request, token)
    log.info(`[${request.auth.credentials["user_id"]}] - signout`)
    return { status: true, code: 200, message: "Successfully sign out" }
}

const update_data = async (request, token) => {
    let sql = {
        text: `update ${SCHEMA.DRWS}.${TABLE.LOGIN_LOG} set signout_on = clock_timestamp(), status = $1 
            where 1 = 1 and access_token = $2`,
        values: ['Signout', token]
    }
    try {
        await Dao.execute_value(request.pg, sql)
        await Dao.del_value(request.redis_wdb, token)
    } catch (e) {
        log.error(`An exception occurred while updating login log : ${e}`)
    }
}

module.exports = route_controller