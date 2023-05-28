"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../../util/log");
const Dao = require("../../../../util/dao");
const { API, TABLE, MESSAGE } = require("../../../../util/constant");
const { autheticatedUserInfo } = require("../../../../util/helper");

const query_scheme = Joi.object({
    oid: Joi.string().trim().min(1).max(128).required(),
});

const get_by_oid = {
    method: "GET",
    path: API.CONTEXT + API.MASTER_SETTINGS_GET_EMPLOYEE_BY_OID,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "get setting employee by oid",
        plugins: { hapiAuthorization: false },
        validate: {
            query: query_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 301, status: false, message: err }).takeover();
            },
        },
    },
    handler: async (request, h) => {
        log.debug(`Request received - ${JSON.stringify(request.query)}`);
        const response = await handle_request(request);
        log.debug(`Response sent - ${JSON.stringify(response)}`);
        return h.response(response);
    },
};

const handle_request = async (request) => {
    try {
        let data = await get_data(request);
        if (!data || data.length != 1) {
            return {
                status: true,
                code: 200,
                message: MESSAGE.NO_DATA_FOUND,
                data: data
            };
        }
        log.info(`employee data found by oid`);
        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_BY_OID,
            data: data
        };
    } catch (err) {
        log.error(err);
    }
};

const get_data = async (request) => {
    const userInfo = await autheticatedUserInfo(request);
    let data = null, query = null;
    query = `select d.oid, d.nameEn, d.nameBn, d.status, d.mobileNo, d.companyMobileNo, d.email, d.imagePath, d.nid, d.passportNo, 
    d.grossSalary, d.mobileLimit, d.tax, to_char(d.joiningDate, 'YYYY-MM-DD') as joiningDate,
    d.bankAccountTitle, d.bankAccountNo, d.departmentOid, d.designationOid, d.bankOid
    from ${TABLE.EMPLOYEE} d
    where 1 = 1 and d.companyOid = $1 and d.oid = $2`;
    let sql = {
        text: query,
        values: [userInfo.companyoid, request.query.oid,]
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql);
        data = data_set.length < 1 ? null : data_set[0];
    } catch (e) {
        log.error(`An exception occurred while getting data by oid: ${e}`);
    }
    return data;
};

module.exports = get_by_oid;
