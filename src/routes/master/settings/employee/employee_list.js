"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../../util/log");
const Dao = require("../../../../util/dao");
const { API, MESSAGE, TABLE } = require("../../../../util/constant");
const { autheticatedUserInfo } = require("../../../../util/helper");

const query_scheme = Joi.object({
    status: Joi.string().trim().allow(null, '').optional(),
    searchText: Joi.string().trim().allow(null, '').max(128).optional(),
    offset: Joi.number().allow(null, '').max(99999999).optional(),
    limit: Joi.number().allow(null, '').max(99999999).optional(),
});

const get_list = {
    method: "GET",
    path: API.CONTEXT + API.MASTER_SETTINGS_GET_EMPLOYEE_LIST,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "master setting employee list",
        plugins: { hapiAuthorization: false },
        validate: {
            query: query_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 400, status: false, message: err }).takeover();
            },
        },
    },
    handler: async (request, h) => {
        log.info(`Request received - ${JSON.stringify(request.query)}`);
        const response = await handle_request(request);
        log.debug(`Response sent - ${JSON.stringify(response)}`);
        return h.response(response);
    },
};

const handle_request = async (request) => {
    try {

        let count = await get_count(request);
        let data = [];
        if (count == 0) {
            log.info(`No data found`);
            return { status: false, code: 400, message: `No data found` };
        }
        data = await get_data(request)
        log.info(`[${count}] found`);
        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_LIST,
            data: data,
            count: count
        };
    } catch (err) {
        log.error(`An exception occurred while getting master settings designation list data : ${err}`);
        return {
            status: false,
            code: 500,
            message: MESSAGE.INTERNAL_SERVER_ERROR
        };
    }
};

const get_count = async (request) => {
    const userInfo = await autheticatedUserInfo(request);
    let count = 0;
    let data = [];
    let query = `select count(e.oid)::int4 as total
    from ${TABLE.EMPLOYEE} e 
    left join ${TABLE.DEPARTMENT} d on d.oid = e.departmentOid
    left join  ${TABLE.DESIGNATION} des on des.oid = e.departmentOid
    where 1 = 1`;
    let idx = 1;
    query += ` and e.companyoid = $${idx++}`;
    data.push(userInfo.companyoid);
    if (request.query['status']) {
        query += `  and e.status = $${idx++}`
        data.push(request.query['status']);
    }
    if (request.query['searchText']) {
        const searchText = '%' + request.query['searchText'].trim().toLowerCase() + '%';
        query += ` and e.nameEn ilike $${idx}
        or des.nameEn ilike $${idx}
        or e.status ilike $${idx}
        or e.mobileNo ilike $${idx}
        or d.nameEn ilike $${idx}
        or e.nid ilike $${idx}
        or e.passportNo ilike $${idx}`
        data.push(searchText);
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
};

const get_data = async (request) => {
    const userInfo = await autheticatedUserInfo(request);
    let list_data = [];
    let data = [];
    let query = `select e.oid, e.nameEn as "name_en", e.status, e.mobileNo as "mobile_no", e.email, e.imagePath as "image_path", e.nid, e.passportNo as "passport_no",
    des.nameEn as "designation_name_en", d.nameEn as departmentNameEn
    from ${TABLE.EMPLOYEE} e 
    left join ${TABLE.DEPARTMENT} d on d.oid = e.departmentOid
    left join  ${TABLE.DESIGNATION} des on des.oid = e.departmentOid
    where 1 = 1`;
    let idx = 1;
    query += ` and e.companyoid = $${idx++}`;
    data.push(userInfo.companyoid);
    if (request.query['status']) {
        query += `  and e.status = $${idx++}`
        data.push(request.query['status']);
    }
    if (request.query['searchText']) {
        const searchText = '%' + request.query['searchText'].trim().toLowerCase() + '%';
        query += ` and e.nameEn ilike $${idx}
        or des.nameEn ilike $${idx}
        or e.status ilike $${idx}
        or e.mobileNo ilike $${idx}
        or d.nameEn ilike $${idx}
        or e.nid ilike $${idx}
        or e.passportNo ilike $${idx++}`
        data.push(searchText);
    }
    query += ` order by d.sortOrder asc, des.sortOrder asc, e.joiningdate asc`;
    if (request.query.offset) {
        query += ` offset $${idx++}`;
        data.push(request.query.offset);
    }
    if (request.query.limit) {
        query += ` limit $${idx++}`;
        data.push(request.query.limit);
    }
    console.log(query)
    console.log(data)
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
};

module.exports = get_list;
