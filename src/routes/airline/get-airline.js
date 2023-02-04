/**
 * Title: Get Supplier module
 * Description: This module created for get Supplier list from database
 * Author: nazim
 * Date: 30/01/2023
 */


"use strict"

// Dependencies 
const log = require("../../util/log")
const Dao = require("../../util/dao")
const Helper = require("../../util/helper")
const { API, TABLE } = require("../../util/constant");

// router_controller object
const route_controller = {
    method: 'GET',
    path: API.CONTEXT + API.GET_AIRLINE,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt"

        },
        description: "Get Airline ",
        plugins: {
            hapiAuthorization: {
                validateEntityAcl: false,
                validateAclMethod: 'isGranted',
                aclQuery: async ( id, request) => {
                    return {
                        isGranted: async ( supplier, role) => {
                            return await Helper.is_granted( request, API.GET_AIRLINE)
                        }
                    }
                }
            }
        }
    },

    handler: async ( request, h) => {
        log.debug(`Request recived - ${ JSON.stringify(request.payload)}`)
        const response = await handle_request(request)
        log.debug(`Response send - ${ JSON.stringify(response)}`)

        return h.response(response)
    }
}

// handle request function
const handle_request = async (request) => {
    let data = await get_airline_data(request)

    if(!data){
        log.info('Airline info not Found!')
        return { status: true, code: 201, message: 'Airline info not Found !'}
    }
    log.info('Airline info found')
    return { status: true, code: 200, data: data}
}
// Get Data function
const get_airline_data = async (request)  => {
    let data = null
    let sql = {
        text : ` select * from ${ TABLE.AIRLINE }`
    }
    try{
        let data_set = await Dao.get_data(request.pg, sql)
        data = data_set.length > 0 ? data_set : null

    }
    catch(e){
        log.error(`An exception occurred while getting airline data: ${e?.message}`)
    }
    return data
}

// Route controller object export
module.exports = route_controller;
