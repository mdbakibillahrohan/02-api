/****
 * Title: Get Passport Info
 * Description: Get Passport Info Form Database
 * Author: Nazim
 * Date: 18/1/2023
 *** */

"use strict"

// required file module 
const log = require("../../util/log")
const Dao = require("../../util/dao")
const Helper = require("../../util/helper")
const { API, TABLE } = require("../../util/constant");


// router_controller object
const route_controller = {
    method: 'GET',
    path: API.CONTEXT + API.GET_PASSPORT,
    options: {

        description: 'Get Passport'
    },
    
    handler: async (request, h) => {
        // console.log("in handler ",request)
        log.debug(`Request recived - ${JSON.stringify(request.payload)}`)
        const response = await handle_request(request)
        log.debug(`Response send - ${ JSON.stringify(response)}`)
        return h.response(response)
    }
}   

// handle request object
const handle_request = async (request) => {
    let data = await get_passport_data(request);
    if(!data){
        log.info('Passport info not found')
        return { status: true, code: 201, message: 'Passport info not found'}
    }
    log.info('Passport info found')
    return { status: true, code: 200, data: data}
}

// Get Data Object
const get_passport_data = async (request)  => {
    let data = null
    let sql = {
        text : ` select * from ${ TABLE.PASSPORT }`
    }
    try{
        let data_set = await Dao.get_data(request.pg, sql)
        data = data_set.length > 0 ? data_set : null

    }
    catch(e){
        log.error(`An exception occurred while getting passport data: ${e?.message}`)
    }
    return data
}

// route controller object export
module.exports = route_controller;
