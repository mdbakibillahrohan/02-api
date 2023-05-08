"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const query_scheme = Joi.object({
    status: Joi.string().trim().min(1).max(32).optional(),
    customerOid: Joi.string().trim().allow(null, '').max(128).optional(),
    searchText: Joi.string().trim().allow(null, '').max(128).optional(),
    offset: Joi.number().allow(null, '').max(99999999).optional(),
    limit: Joi.number().allow(null, '').max(99999999).optional(),
})

const route_controller = {
    method: "GET",
    path: API.CONTEXT + API.MASTER_PASSPORT_GET_LIST_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Master Passport List",
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
            count: count,
            data: data,
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
    
    let query = `select count(p.oid) from ${ TABLE.PASSPORT } as p , ${ TABLE.CUSTOMER } as c where 1 = 1 and c.oid = p.customerOid and p.companyoid = $1`;

    data.push(userInfo.companyoid);
    let idx = 2;
    if(request.query['customerOid']){
        query += ` and p.customerOid = ${idx++}`;
        data.push(request.query['customerOid'])
    }
    if (request.query["searchText"]) {
        query += ` and p.surName ilike $${idx} or 
            p.givenName ilike $${idx} or 
            p.passportNumber ilike $${idx} or 
            c.name ilike $${idx++} `;
        data.push(`% ${request.query["searchText"].trim()} %`)
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
    let query = `select p.oid, p.surName as "sur_name", p.givenName as "given_name", p.gender, p.nationality, p.countryCode as "country_code", p.personalNo as "personal_no", p.passportNumber as "passport_number", p.previousPassportNumber as "previous_passport_number", to_char(p.birthDate, 'YYYY-MM-DD') as "birth_date" , to_char(p.birthDate :: DATE, 'dd-Mon-yyyy') as "birth_date_en" ,  to_char(p.passportIssueDate, 'YYYY-MM-DD') as "passport_issue_date", to_char(p.passportIssueDate :: DATE, 'dd-Mon-yyyy') as "passport_issue_date_en", to_char(p.passportExpiryDate, 'YYYY-MM-DD') as "passport_expiry_date", to_char(p.passportExpiryDate :: DATE, 'dd-Mon-yyyy') as "passport_expiry_date_en", p.passportexpirydate::date - current_date::date as "expire_day", p.passportImagePath as "passport_image_path", p.issuingAuthority as "issuing_authority", p.description, p.status, c.name as "customer_name" from  ${ TABLE.PASSPORT } as p, ${ TABLE.CUSTOMER } as c  where 1 = 1 and c.oid = p.customerOid`;

    let idx = 1;
    query += ` and p.companyoid = $${idx++}`;
    data.push(userInfo.companyoid);

    if (request.query['status']) {
        query += ` and status = $${idx++} and (p.passportexpirydate::date - current_date::date) > 0`;
        data.push(request.query['status'])
    }

    if(request.query['customerOid']){
        query += ` and p.customerOid = ${idx++}`;
        data.push(request.query["customerOid"])
    }
    if (request.query["searchText"]) {
        query += ` and p.surName ilike $${idx} or 
            p.givenName ilike $${idx} or 
            p.passportNumber ilike $${idx} or 
            c.name ilike $${idx++} `;
        data.push(`% ${request.query["searchText"].trim()} %`)
    }
    query += ` order by p.createdOn desc`;

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
 