
/**
 * Title: Get Ticket List
 * Description: This endpoint handling the get ticket list request and handling the neccessay action.
 * Method: GET
 * RequiredAuthentication: true
 * Authentication Strategy: jwt
 * File Path: src/routes/ticket/get_ticket_list.js
 * Author: Md Bakibillah (Rohan)
 */

"use strict"

const log = require("../../util/log")
const Dao = require("../../util/dao")
const Helper = require("../../util/helper")
const { API, TABLE } = require("../../util/constant")


// Route controller for get customer 
const route_controller = {
    method: "GET",
    path: API.CONTEXT + API.GET_TICKET_LIST,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Get Ticket List",
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

// Handling the request 
const handle_request = async (request) => {
    let data = await get_data(request)
    if (!data) {
        log.info(`Ticket data not found`)
        return { status: true, code: 206, message: 'Ticket data not found' }
    }
    log.info(`Ticket data found`)
    return { status: true, code: 200, data: data }
}

// Get data from the database 
const get_data = async (request) => {
    let data = null
    const UserInfo = await Helper.autheticatedUserInfo(request);
    let sql = {
        text: `SELECT * FROM ${TABLE.TICKET} WHERE companyoid = $1`,
        values: [UserInfo.companyoid]
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql)
        data = data_set.length > 0 ? data_set : null
    } catch (e) {
        log.error(`An exception occurred while getting ticket data: ${e?.message}`)
    }
    return data
}

// exporting the modules for using in another file 
module.exports = route_controller