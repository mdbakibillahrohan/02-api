"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const query_scheme = Joi.object({
    searchText: Joi.string().trim().allow(null, '').max(128).optional(),
    offset: Joi.number().allow(null,'').max(100000000000).optional(),
    limit: Joi.number().allow(null, '').max(100000000000).optional(),
})

const route_controller = {
    method: "GET",
    path: API.CONTEXT + API.MASTER_GET_SUPPLIER_LIST_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Master Supplier List",
        plugins: {
            hapiAuthorization: false,
        },
        validate: {
            query: query_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async(request, h, err) => {
                return h.response({
                    code: 400, status: false, message: err?.message
                }).takeover();
            },
        },
    },
    handler: async(request, h) => {
        log.info(`Request received - ${JSON.stringify(request.query)}`);
        const response = await handle_request(request);
        log.debug(`Response sent - ${JSON.stringify(response)}`)
        return h.response(response);
    },
};

const handle_request = async (request) => {
    try {
        let count = await get_count(request);
        let data = [];
        if (count == 0){
            log.info(MESSAGE.NO_DATA_FOUND);
            return { 
                status: false, 
                code:400,
                message: MESSAGE.NO_DATA_FOUND 
            };
        }
        data = await get_data(request);
        log.info(`[${count}] found`)
        
        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_LIST,
            data: data,
            count: count
        };
    } catch( err ){
        log.error(`An exception occurred while getting supplier list data: ${err?.message}`);
        return {
            status: false,
            code: 500,
            message: MESSAGE.INTERNAL_SERVER_ERROR
        };
    }
};
const get_count = async (request) => {
    let userInfo = await autheticatedUserInfo(request)
    let count = 0;
    let data = [];
    
    let query = `select count(oid) from ${ TABLE.SUPPLIER} where 1 = 1`;
    let idx = 1;

    query += ` and companyoid = $${idx}`;
    idx++;
    data.push(userInfo.companyoid);
    if (request.query['searchText']) {
        const searchText = '%' + request.query['searchText'].trim().toLowerCase() + '%';
        query += ` and lower(name) like $${idx} or`;
        idx++;
        query += `  lower(mobileno) like $${idx} or`;
        idx++;
        query += ` lower(email) like $${idx} `;
        idx++;

        data.push(searchText, searchText, searchText)

    }
    let sql = {
        text: query,
        values: data
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql);
        count = data_set[0]["count"];

        log.info(count)
    } catch (err) {
        log.error(err)
        throw new Error(err);
    }
    return count;
}
const get_data = async (request) => {
    const userInfo = await autheticatedUserInfo(request);
    let list_data = [];
    let data = [];
    let idx = 1;
    let query = `select s.oid, s.customerId, s.name, s.address, s.mobileNo, s.email, s.imagePath, s.status, s.initialBalance, s.commissionType, s.commissionValue, s.serviceCharge, s.supplierType, supplier_balance(s.oid) as balance, supplier_creditnote_balance(s.oid) as vendorCreditBalance, (select coalesce(sum(p.amount)) as amount from ${ TABLE.PAYMENT } as p where 1 = 1 and status = $1) from ${TABLE.SUPPLIER} as s where 1 = 1`;

    data.push(request.query['status'])
    idx++;
    query += ` and companyoid = $${idx}`;
    idx++;
    data.push(userInfo.companyoid);

    if (request.query['searchText']) {
        const searchText = '%' + request.query['searchText'].trim().toLowerCase() + '%';
        query += ` and lower(s.name) like $${idx} or`;
        idx++;
        query += `  lower(s.mobileno) like $${idx} or`;
        idx++;
        query += ` lower(s.email) like $${idx} `;
        idx++;

        data.push(searchText, searchText, searchText)
    }
    query += ` order by s.createdOn desc`;
    idx ++;

    if (request.query.offset) {
        query += ` offset $${idx++}`;
        data.push(request.query.offset);
    }
    if (request.query.limit) {
        query += ` limit $${idx++}`;
        data.push(request.query.limit)
    }
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
}
module.exports = route_controller;
 