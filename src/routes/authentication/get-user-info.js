"use strict"

const log = require("../../util/log")
const Dao = require("../../util/dao")
const Helper = require("../../util/helper")
const { API, TABLE } = require("../../util/constant")

const route_controller = {
    method: "GET",
    path: API.CONTEXT + API.GET_USER_INFO,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "User info",
        plugins: {
            hapiAuthorization: {
                validateEntityAcl: true,
                validateAclMethod: 'isGranted',
                aclQuery: async (id, request) => {
                    return {
                        isGranted: async (user, role) => { 
                            // return await Helper.is_granted(request, API.GET_USER_INFO)
                            return true;
                        }
                    }
                }
            }
         }
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
        return { status: true, code: 201, message: 'User data not found' }
    }
    log.info(`User data found`)
    return { status: true, code: 200, data: data }
}

const get_data = async (request) => {
    let data = null
    let sql = {
        text: `select  * from ${TABLE.LOGIN} l
            where 1 = 1 and loginid = $1`,
        values: [request.auth.credentials["loginid"]]
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql)
        data = data_set.length > 0 ? data_set[0] : null
    } catch (e) {
        log.error(`An exception occurred while getting user data: ${e?.message}`)
    }
    return data
}


module.exports = route_controller
