"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const query_scheme = Joi.object({
    // status: Joi.string().trim().min(1).max(32).required(),
    searchText: Joi.string().trim().allow(null, '').max(128).optional(),
    offset: Joi.number().allow(null, '').max(99999999).optional(),
    limit: Joi.number().allow(null, '').max(99999999).optional(),
})

const route_controller = {
    method: "GET",
    path: API.CONTEXT + API.MASTER_PAYMENT_GET_LIST_PATH,
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
            failAction: async (request, h, err) => {
                return h.response({
                    code: 400, status: false, message: err
                }).takeover();
            },
        },
    },
    handler: async (request, h) => {
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
        if (count == 0) {
            log.info(MESSAGE.NO_DATA_FOUND);
            return {
                status: false,
                code: 400,
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
    } catch (err) {
        log.error(`An exception occurred while getting supplier list data: ${err}`);
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

    let query = `select count(oid) from ${TABLE.PAYMENT} where 1 = 1 and companyoid = $1`;

    data.push(userInfo.companyoid);
    let idx = 2;
    if (request.query["referenceOid"]) {
        query += ` and referenceOid = $${idx++}`;
        data.push(request.query["referenceOid"])
    }
    if (request.query["referenceType"]) {
        query += `  and referenceType = $${idx++} `;
        data.push(request.query["referenceType"])
    }
    if (request.query["paymentType"]) {
        query += ` and paymentType = $${idx++}`;
        data.push(request.query["paymentType"])
    }
    if (request.query["paymentNature"]) {
        query += ` and paymentNature = $${idx++} `;
        data.push(request.query["paymentNature"])
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
    let query = `select p.oid, p.paymentNo as "payment_no", to_char(p.paymentDate 'YYYY-MM-DD') as "payment_date", p.entryType as "entry_type", p.checkNo as "check_no", p.status, p.paymentType as "payment_type", p.referenceOid as "reference_oid", p.referenceType as "reference_type", p.amount, p.accountHolderName as "account_holder_name", p.bankAccountNo as "bank_account_no", p.bankName as "bank_name", p.branchName as "branch_name" , p.paymentMode as "payment_mode", p.referenceBy as "reference_by", p.referenceByMobileNo as "reference_by_mobile_no", p.receivedBy as "received_by", to_char(p.chequeIssueDate, 'YYYY-MM-DD') as "cheque_issue_date", to_char(p.chequeIssueDate :: DATE, 'dd-Mon-yyyy') as "cheque_issue_date_en", to_char(p.paymentDate :: DATE, 'dd-Mon-yyyy') as "payment_date_en", a.name as "account_name", p.accountOid as "account_oid", p.description, p.imagePath as "image_path", p.paymentNature as "payment_nature", (CASE WHEN p.referenceType = 'Customer' THEN c.name ELSE s.name END) as "reference_name" from ${TABLE.PAYMENT} as p left join ${TABLE.CUSTOMER} as c on p.referenceOid = c.oid left join ${TABLE.SUPPLIER} as s on p.referenceOid = s.oid left join ${TABLE.ACCOUNT} as a on p.accountOid = a.oid where 1 = 1 and p.companyOid = $1`;

    data.push(userInfo.companyoid);
    let idx = 2;

    if (request.query["referenceOid"]) {
        query += ` and referenceOid = $${idx++}`;
        data.push(request.query["referenceOid"])
    }
    if (request.query["referenceType"]) {
        query += `  and referenceType = $${idx++} `;
        data.push(request.query["referenceType"])
    }
    if (request.query["paymentType"]) {
        query += ` and paymentType = $${idx++}`;
        data.push(request.query["paymentType"])
    }
    if (request.query["paymentNature"]) {
        query += ` and paymentNature = $${idx++} `;
        data.push(request.query["paymentNature"])
    }
    if (request.query.offset) {
        query += ` offset $${idx++}`;
        data.push(request.query.offset);
    }
    if (request.query.limit) {
        query += ` limit $${idx++}`;
        data.push(request.query.limit)
    }
    query += ` order by p.paymentDate desc`
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
