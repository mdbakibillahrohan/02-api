"use strict"

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const payload_scheme = Joi.object({
    oid: Joi.string().trim().min(1).max(128).required()
});

const route_controller = {
    method: "POST",
    path: API.CONTEXT + API.PAYMENT_MADE_DELETE_BY_OID_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "delete by oid",
        plugins: { hapiAuthorization: false },
        validate: {
            payload: payload_scheme,
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
        let deletePayment = await deletePaymentReceived(request);
        
        log.info(`data deleted by oid`);
        if( deletePayment["rowCount"] < 1){
            return { status: true, code: 400, message: MESSAGE.USER_NOT_EXIST };
        }
        else if( deletePayment["rowCount"] == 1){
            log.info(`Successfully emailSupplier Delete`);
            return { status: true, code: 200, message: MESSAGE.SUCCESS_DELETE };
        }
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };

    } catch (err) {
        log.error(err?.message);
    }
}
const deletePaymentReceived = async (request) => {
    const userInfo = await autheticatedUserInfo(request);
    let query = `delete from ${ TABLE.PAYMENT }  where 1 = 1 and oid = $1 and companyoid = $2`;

    let sql = {
        text: query,
        values: [request.payload.oid, userInfo.companyoid]
    }
    try{
      return await Dao.execute_value(request.pg, sql);
    } catch(err) {
        log.error(`DeleteSupplierEmailService error: ${err?.message}`)
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };

    }
}

module.exports = route_controller;