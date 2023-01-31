"use strict"

const uuid = require("uuid")
const _ = require("underscore")
const Joi = require("@hapi/joi")
const log = require("../../util/log")
const Dao = require("../../util/dao")
const JWT = require("jsonwebtoken")
const requestIp = require('request-ip')
const { API, TABLE, TEXT } = require("../../util/constant")
const { default: ms } = require("ms")

const payload_scheme = Joi.object({
    user_id: Joi.string().trim().min(1).max(128).required(),
    password: Joi.string().trim().min(1).max(128).required()
})

const route_controller = {
    method: "POST",
    path: API.CONTEXT + API.SIGN_IN,
    options: {
        auth: false,
        description: "Sign in user",
        plugins: { hapiAuthorization: false },
        validate: {
            payload: payload_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 301, status: false, message: err?.message }).takeover()
            },
        },
    },
    handler: async (request, h) => {
        log.debug(`Request received - ${JSON.stringify(request.payload)}`)
        const response = await handle_request(request, h)
        log.debug(`Response sent - ${JSON.stringify(response)}`)
        return h.response(response)
    }
}

const handle_request = async (request, h) => {
    let data = await get_data(request)
    if (data == null) {
        log.warn(`[${request.payload["user_id"]}] - Invalid user_id/password`)
        return { status: false, code: 201, message: `Invalid user_id/password` }
    }
    if (data['status'] !== 'Active') {
        log.warn(`[${request.payload["user_id"]}] - is not active`)
        return { status: false, code: 201, message: `User is not active` }
    }
    let user = _.pick(data, 'loginid')
    let token = JWT.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_SECRET_EXPIRE,
        algorithm:TEXT.ALGORITHM 
    })
    // await Dao.set_token(request.redis_db, token, JSON.stringify(data), process.env.ACCESS_TOKEN_SECRET_EXPIRE)
    await Dao.set_value(request.redis_db, token, JSON.stringify(data), process.env.ACCESS_TOKEN_SECRET_EXPIRE);
    await save_data(request, data['oid']);
    log.info(`[${request.payload["user_id"]}] - signin`)
    return { status: true, code: 200, token: { access_token: token }, mesage: 'Successfully sign in' }
}

const get_data = async (request) => {
    let data = null
    let sql = {
        text: `select * from ${TABLE.LOGIN}
            where 1 = 1 and loginid = $1 and password = $2`,
        values: [request.payload["user_id"], request.payload["password"]]
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql)
        data = data_set.length == 1 ? data_set[0] : null
    } catch (e) {
        log.error(`An exception occurred while getting user data: ${e?.message}`)
    }
    return data
}

const save_data = async (request, login_oid) => {
    let oid = uuid.v4()
    let cols = ['oid', 'ipaddress', 'loginOid', 'loginTime', 'logoutTime', 'status']
    let params = ['$1', '$2', '$3', 'clock_timestamp()', `clock_timestamp() + interval '${ms(process.env.ACCESS_TOKEN_SECRET_EXPIRE)/(1000*60*60*24)} days'`, '$4']
    let data = [oid, requestIp.getClientIp(request), login_oid, 'Login']
    let col = cols.join(', ')
    let param = params.join(', ')
    let query = `insert into ${TABLE.LOGIN_LOG} (${col}) values (${param})`
    let sql = { text: query, values: data }
    /* store data in login log table with token */
    try {
        await Dao.execute_value(request.pg, sql)
    } catch (e) {
        log.error(`An exception occurred while saving login log : ${e?.message}`)
    }
}

module.exports = route_controller
