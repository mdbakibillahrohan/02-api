"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, TABLE, MESSAGE } = require("../../../util/constant");

const payload_scheme = Joi.object({
    oid: Joi.string().trim().min(1).max(128).required()
});

const delete_by_oid = {
    method: "POST",
    path: API.CONTEXT + API.TICKET_DEPARTURE_CARD_DELETE_BY_OID_PATH,
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
        const delete_d = await delete_data(request);
        
        if( delete_d["rowCount"] == 1){
            log.info(`delete data by oid`);
            return {
                status: true,
                code: 200,
                message: MESSAGE.SUCCESS_DELETE,
    
            };
        }
        if( delete_d["rowCount"] == 0){
            log.info(`no data found by oid`);
            return {
                status: true,
                code: 400,
                message: MESSAGE.NO_DATA_FOUND,
    
            };
        }
        log.error(`An exception occurred while deleting: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };

    } catch (err) {
        log.error(`An exception occurred while deleting: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const delete_data = async (request) => {
    let sql = {
        text: `delete from ${TABLE.DEPARTMENT} where 1 = 1 and oid = $1`,
        values: [request.payload.oid]
    }
    try {
       return await Dao.execute_value(sql)
    } catch (e) {
        log.error(`An exception occurred while removing data by oid: ${e?.message}`);
    }
    return data;
};

const updateTicket = async (request) => {

    let cols = [ "departureCardOid = $1"];

    let data = ['null'];
    

    let scols = cols.join(', ')

    let query = `"update " + Table.TICKET + " set "+sCols+" where 1 = 1 and departureCardOid = ?`;
    
    let sql = {
        text: query,
        values: data
    }
    try{
        return await Dao.execute_value(request.pg, sql)
    } 
    catch(err) {
        log.error(`An exception occurred while updating: ${err?.message}`)
    }
}

module.exports = delete_by_oid;
