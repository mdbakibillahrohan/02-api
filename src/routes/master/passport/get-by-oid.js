"use strict"

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE } = require("../../../util/constant");
// const { autheticatedUserInfo } = require("../../../util/helper");

const query_scheme = Joi.object({
    oid: Joi.string().trim().min(1).max(128).required()
});

const route_controller = {
    method: "GET",
    path: API.CONTEXT + API.MASTER_PASSPORT_GET_BY_OID_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "get passport by oid",
        plugins: { hapiAuthorization: false },
        validate: {
            query: query_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 301, status: false, message: err?.message }).takeover();
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
        
        log.info(`data found by oid`);
        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_BY_OID,
            data: data
        };
    } catch (err) {
        log.error(err?.message);
    }
}
const get_data = async (request) => {
    let data = null, query = null;
    query = `select p.oid, p.fullName, p.surName, p.givenName, p.gender, p.nationality, 
			p.mobileNo, p.email, p.countryCode, p.birthRegistrationNo, p.personalNo, 
			p.passportNumber, p.passportNumber as clonePassportNumber, p.previousPassportNumber,to_char(p.birthDate, 'YYYY-MM-DD') as birthDate,
			to_char(p.birthDate :: DATE, 'dd-Mon-yyyy') as birthDateEN, 
			to_char(p.passportIssueDate, 'YYYY-MM-DD') as passportIssueDate, 
			to_char(p.passportIssueDate :: DATE, 'dd-Mon-yyyy') as passportIssueDateEN, 
			to_char(p.passportExpiryDate, 'YYYY-MM-DD') as passportExpiryDate, 
			to_char(p.passportExpiryDate :: DATE, 'dd-Mon-yyyy') as passportExpiryDateEN, 
			p.passportImagePath, p.issuingAuthority, p.description, p.status, p.customerOid, p.countryOid from ${ TABLE.PASSPORT } as p where 1 = 1 and p.oid = $1 `;
    let sql = {
        text: query,
        values: [request.query.oid]
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql);
        console.log(data_set)
        data = data_set.length < 1 ? null : data_set[0];
    } catch (e) {
        log.error(`An exception occurred while getting data by oid: ${e?.message}`);
    }
    return data;
}
module.exports = route_controller;