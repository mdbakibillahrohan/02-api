
/**
 * Title: Get Vendor List
 * Description: This endpoint handling the get vendor list request and handling the neccessay action.
 * Method: GET
 * RequiredAuthentication: true
 * Authentication Strategy: jwt
 * File Path: src/routes/vendor/get_vendor_list.js
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
    path: API.CONTEXT + API.GET_VENDOR_LIST,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Get Vendor List",
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
        log.info(`Vendor data not found`)
        return { status: true, code: 206, message: 'Vendor data not found' }
    }
    log.info(`Vendor data found`)
    return { status: true, code: 200, data: data }
}
const get_count = async (request) =>{
    let count = 0;
    let data = [];
    let query = `select count(*)::int4 as total from ${TABLE.SUPPLIER} where 1 = 1 `;
    let idx = 1;
    if (request.query['status']) {
        query += ` and status = $${idx++}`;
        data.push(request.query['status'])
    }
    if (request.query['searchText']) {
        query += ` and (status ilike $${idx})`;
    idx++;
    data.push('%' + request.query['searchText'].trim() + '%');
    }
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
// Get data from the database 
const get_data = async (request) => {
    let list_data = [];
    let data = []
    const UserInfo = await Helper.autheticatedUserInfo(request);

    let sql = {
        text: `SELECT * FROM ${TABLE.SUPPLIER} WHERE companyoid = $1`,
        values: [UserInfo.companyoid]
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql)
        data = data_set.length > 0 ? data_set : null
    } catch (e) {
        log.error(`An exception occurred while getting vendor data: ${e?.message}`)
    }
    return data
}

// exporting the modules for using in another file 
module.exports = route_controller
