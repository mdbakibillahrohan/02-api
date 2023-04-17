"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const query_scheme = Joi.object({
    ticketNo: Joi.string().trim().max(128).optional(),
    searchText: Joi.string().trim().allow(null, '').max(128).optional(),
    status: Joi.string().max(128).optional(),
    offset: Joi.number().allow(null, '').max(99999999).optional(),
    limit: Joi.number().allow(null, '').max(99999999).optional(),
});

const get_list = {
    method: "GET",
    path: API.CONTEXT + API.INVOICE_TICKET_GET_DRAFT_TICKET_LIST,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Draft Ticket list of Invoice Ticket List",
        plugins: { hapiAuthorization: false },
        validate: {
            query: query_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 400, status: false, message: err?.message }).takeover();
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
            data,
            count
        };
    } catch (err) {
        log.error(`An exception occurred while getting invoice ticket, draft ticket list data : ${err?.message}`);
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
    let data = [userInfo.companyoid, CONSTANT.DRAFT];
    let query = `select count(t.oid) as total
    from ${TABLE.DRAFT_TICKET} t 
    where 1 = 1 and t.companyOid = $1 
    and t.status = $2`;
    let idx = 3;

    if (request.query['ticketNo']) {
        query += ` and t.ticketNo like $${idx++}`;
        data.push(`%${request.query["ticketNo"]}%`);
    }
    if (request.query['status'] && request.query["status"].toLowerCase() != CONSTANT.ALL.toLocaleLowerCase()) {
        query += ` and t.status = $${idx++}`;
        data.push(request.query["status"]);
    }

    if (request.query['searchText']) {
        query += ` and t.subject ilike $${idx} or t.pnr ilike $${idx} or t.ticketNo ilike $${idx++}`;
        data.push(`%${request.query['searchText'].trim()}%`);
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
    let data = [userInfo.companyoid];
    let query = `select t.oid, t.subject, t.pnr, t.ticketNo as "ticket_no", t.ticketJson as "ticket_json", 
    t.createdOn as "created_on", to_char(t.createdOn :: DATE, 'dd-Mon-yyyy') as "created_on_str" 
    from ${TABLE.DRAFT_TICKET} t
    where 1 = 1 and t.companyOid = $1`;
    let idx = 2;
    if (request.query['ticketNo']) {
        query += ` and t.ticketNo like $${idx++}`;
        data.push(`%${request.query["ticketNo"]}%`);
    }
    if (request.query['status'] && request.query["status"].toLowerCase() != CONSTANT.ALL.toLocaleLowerCase()) {
        query += ` and t.status = $${idx++}`;
        data.push(request.query["status"]);
    }

    if (request.query['searchText']) {
        query += ` and t.subject ilike $${idx} or t.pnr ilike $${idx} or t.ticketNo ilike $${idx++}`;
        data.push(`%${request.query['searchText'].trim()}%`);
    }
    query += ` order by t.createdOn desc`;
    if (request.query.offset) {
        query += ` offset $${idx++}`;
        data.push(request.query.offset);
    }
    if (request.query.limit) {
        query += ` limit $${idx++}`;
        data.push(request.query.limit);
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
};

module.exports = get_list;
