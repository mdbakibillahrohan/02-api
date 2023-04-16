"use strict"

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE } = require("../../../util/constant");
// const { autheticatedUserInfo } = require("../../../util/helper");

const query_scheme = Joi.object({
    oid: Joi.string().trim().min(1).max(128).required(),

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
        let data = await get_data_by_oid(request);
        let passport_detail = await get_passport_details(request);
        log.info(`data found by oid`);
        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_BY_OID,
            data,
            passport_detail
            
        };
    } catch (err) {
        log.error(err?.message);
    }
}
const get_data_by_oid = async (request) => {
    let data = null, query = null;
    query = `select p.oid, p.fullName as "full_name", p.surName as "sur_name", p.givenName as "given_name", p.gender, p.nationality, 
			p.mobileNo as "mobile_no", p.email, p.countryCode as "country_code", p.birthRegistrationNo as "birth_registration_no", p.personalNo as "personal_no", p.passportNumber as "passport_number", p.passportNumber as "clone_passport_number", p.previousPassportNumber as "previous_passport_number",to_char(p.birthDate, 'YYYY-MM-DD') as "birth_date", to_char(p.birthDate :: DATE, 'dd-Mon-yyyy') as "birth_date_en", to_char(p.passportIssueDate, 'YYYY-MM-DD') as "passport_issue_date", to_char(p.passportIssueDate :: DATE, 'dd-Mon-yyyy') as "passport_issue_date_en", to_char(p.passportExpiryDate, 'YYYY-MM-DD') as "passport_expiry_date", to_char(p.passportExpiryDate :: DATE, 'dd-Mon-yyyy') as "passport_expiry_date_en", p.passportImagePath as "passport_image_path", p.issuingAuthority as "issuing_authority", p.description, p.status, p.customerOid as "customer_oid", p.countryOid as "country_oid" from ${ TABLE.PASSPORT } as p where 1 = 1 and p.oid = $1 `;
    let sql = {
        text: query,
        values: [request.query.oid]
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql);
        data = data_set.length < 1 ? null : data_set[0];
    } catch (e) {
        log.error(`An exception occurred while getting data by oid: ${e?.message}`);
    }
    return data;
}
const get_passport_details = async (request) => {
    let data = null;
    let query = `select pd.oid, pd.title, pd.imagePath as "image_path", pd.remarks, pd.sortOrder as "sort_order", pd.passportOid as " passport_oid" from ${TABLE.PASSPORT_DETAIL} as pd  where 1 = 1 and pd.passportOid = $1`;

    query += `order by pd.sortOrder asc`;
    let sql = {
        text: query,
        values: [request.query.passportOid]
    }
    try{
        let data_set = await Dao.get_data(request.pg, sql);
        data = data_set.length < 1 ? null : data_set[0];
    } catch (err) {
        log.error(`An exception occurred while getting data by oid: ${e?.message}`);
    }
    return data;

}
module.exports = route_controller;