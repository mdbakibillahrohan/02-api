"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const uuid = require('uuid');
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const payload_scheme = Joi.object({
    oid: Joi.string().trim().min(1).max(128).required(),
    supplierOid: Joi.string().trim().min(1).max(128).required(),

});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.MASTER_SUPPLIER_EMAIL_SERVICE_DELETE_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "supplier email service delete",
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
        log.info(`Request received - ${JSON.stringify(request.payload)}`);
        const response = await handle_request(request);
        log.debug(`Response sent - ${JSON.stringify(response)}`);
        return h.response(response);
    },
};

const handle_request = async (request) => {
    try {
        let update = await deleteSupplierEmailService (request);
        if( update["rowCount"] < 1){
            return { status: true, code: 400, message: MESSAGE.USER_NOT_EXIST };
        }
        else if( update["rowCount"] == 1){
             log.info(`Successfully emailSupplier Delete`);
            return { status: true, code: 200, message: MESSAGE.SUCCESS_DELETE };
        }
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };

    } catch (err) {
        log.error(`An exception occurred while saving: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};


const deleteSupplierEmailService = async ( request) => {
    const userInfo = await autheticatedUserInfo(request);
    let query = `delete from ${ TABLE.SUPPLIER_EMAIL_SERVICE }  where 1 = 1 and oid = $1 and supplierOid = $2 and companyoid = $3`;

    let sql = {
        text: query,
        values: [request.payload.oid, request.payload["supplierOid"], userInfo.companyoid]
    }
    try{
      return await Dao.execute_value(request.pg, sql);
    } catch(err) {
        log.error(`DeleteSupplierEmailService error: ${err?.message}`)
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };

    }
    
}

module.exports = save_controller;
