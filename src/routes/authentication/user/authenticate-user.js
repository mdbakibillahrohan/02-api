"use strict"

const uuid = require("uuid")
const Joi = require("@hapi/joi")
const _ = require("underscore")
const log = require("../../../util/log")
const Dao = require("../../../util/dao")
const JWT = require("jsonwebtoken")
const requestIp = require('request-ip')
const { API, MESSAGE, TABLE, CONSTANT, TEXT } = require("../../../util/constant");
const { default: ms } = require("ms")
require("dotenv").config({ path: `./src/env/.env.${process.env.NODE_ENV}` })

const payload_scheme = Joi.object({
    user_id: Joi.string().trim().min(1).max(128).required(),
    password: Joi.string().trim().min(1).max(128).required()
});

const get_list = {
    method: "POST",
    path: API.CONTEXT + API.AUTHENTICATION_USER_AUTHENTICATE_USER_PATH,
    options: {
        auth: false,
        description: "Authentication user Api",
        plugins: { hapiAuthorization: false },
        validate: {
            payload: payload_scheme,
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
        let data = await getLogin(request)
        if (data == null) {
            log.warn(`[${request.payload["user_id"]}] - Invalid user_id/password`)
            return { status: false, code: 201, message: `Invalid user_id/password` }
        }
        if (data['status'] != 'Active') {
            log.warn(`[${request.payload["user_id"]}] - is not active`)
            return { status: false, code: 201, message: `User is not active` }
        }
        let user = _.pick(data, 'login_id')
        let token = JWT.sign(user, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: process.env.ACCESS_TOKEN_SECRET_EXPIRE,
            algorithm: TEXT.ALGORITHM 
        })
        // await Dao.set_token(request.redis_db, token, JSON.stringify(data), process.env.ACCESS_TOKEN_SECRET_EXPIRE)
        
        // await Dao.set_value(request.redis_db, token, JSON.stringify(data), process.env.ACCESS_TOKEN_SECRET_EXPIRE);
        await insertLoginTrail(request, data["oid"]);
        log.info(`[${request.payload["user_id"]}] - signin`)
        
        return { status: true, code: 200, token: { access_token: token }, menu_json: data["menu_json"], mesage: 'Successfully sign in' }
    }

    catch (err) {
        log.error(`An exception occurred while getting user data: ${err?.message}`)
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };

    }
};

const getLogin = async (request) => {
    let data = [];

    let query = `select l.oid, l.loginId as login_id, l.password, l.status, l.name, 
        r.roleId, r.menuJson as menu_json from ${ TABLE.LOGIN } as l, ${ TABLE.ROLE } as  r
        where 1 = 1 and r.oid = l.roleOid and l.loginId = $1 and password = $2`;

    let sql = {
        text: query,
        values: [request.payload["user_id"], request.payload["password"]]
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql)
        data = data_set.length == 1 ? data_set[0] : null
    } catch (e) {
        log.error(`An exception occurred while getting user data: ${e?.message}`)
    }
    return data
};

const insertLoginTrail = async (request, loginOid) => {
    const oid = uuid.v4()
    let cols = ['oid', 'loginOid', 'ipaddress',  'loginTime', 'logoutTime', 'status']
    let params = ['$1', '$2', '$3', 'clock_timestamp()', `clock_timestamp() + interval '${ms(process.env.ACCESS_TOKEN_SECRET_EXPIRE)/(1000*60*60*24)} days'`, '$4']
    let data = [oid, loginOid, requestIp.getClientIp(request), CONSTANT.LOGIN];

    let col = cols.join(', ')
    let param = params.join(', ')
    let query = `insert into ${TABLE.LOGIN_LOG} (${col}) values (${param})`
    
    let sql = {
        text: query,
        values: data
    }
    try {
       return await Dao.execute_value(request.pg, sql)
    } catch (e) {
        log.error(`An exception occurred while saving login log : ${e?.message}`)
    }
    
};

module.exports = get_list;
