"use strict"

const uuid = require("uuid")
const _ = require("underscore")
const Joi = require("@hapi/joi")
const { default: ms } = require("ms")
const Dao = require("../../util/dao")
const log = require("../../util/log")
const { generate_token } = require("../../util/helper")
const { API, SCHEMA, TABLE } = require("../../util/constant")

const payload_scheme = Joi.object({
	login_id: Joi.string().trim().min(1).max(124).required(),
	password: Joi.string().trim().min(1).max(124).required(),
})

const route_controller = {
	method: "POST",
	path: API.CONTEXT + API.SIGNIN,
	options: {
		auth: false,
		description: "signin",
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
		const response = await handle_request(request)
		log.debug(`Response sent - ${JSON.stringify(response)}`)
		return h.response(response)
	},
}

const handle_request = async (request) => {
	let data = await get_data(request)
	if (data == null) {
		return  { status: false, code: 201, message: `Invalid user` }
	}
	// if (!bcrypt.compareSync(request.payload.password, data["password"])) {
	//     return _.extend(response, { code: 202, message: `Password does not match` })
	// }
	if (data["status"] != "active") {
		return _.extend(response, { code: 203, message: `Inactive user` })
	}
	let user_token = { login_id: request.payload.login_id, role: data["role"] }
	if (data["company_oid"]) {
		user_token = _.extend(user_token, { company_oid: data["company_oid"] })
	}
	let token = await generate_token(user_token)
	let response = { status: true, code: 200, token: token }
	await insert_loginlog(request, response, request.payload.login_id)
	log.info(`[${user_token['company_oid'] != null ? user_token['company_oid'] : 'GDS'}/${user_token['login_id']}] - signin`)
	return response
}

const get_data = async (request) => {
	let data = null
	let sql = {
		text: `select o.password, o.login_id, lower(o.status) as status, r.role_id as role, o.company_oid
            from ${SCHEMA.PUBLIC}.${TABLE.LOGIN} o
            left join ${SCHEMA.PUBLIC}.${TABLE.ROLE} r on r.oid = o.role_oid
            where r.role_id = r.oid 
			and login_id = $1`,
		values: [request.payload.login_id],
	}
	try {
		let data_set = await Dao.get_data(request.pg, sql)
		data = data_set.length > 0 ? data_set[0] : null
	} catch (e) {
		log.error(`An exception occurred while requesting login information : ${e?.message}`)
	}
	return data
}

const insert_loginlog = async (request, response, login_id) => {
	let sql = {
		text: `insert into ${SCHEMA.PUBLIC}.${TABLE.LOGIN_LOG} (oid, access_token, 
            signin_time, sign_out_time, status, login_id) values ($1, $2, clock_timestamp(), 
            clock_timestamp() + interval '${ms(process.env.ACCESS_TOKEN_SECRET_EXPIRE)} millisecond', $3, $4)`,
		values: [uuid.v4(), response["token"]["access_token"], "Signin", login_id],
	}
	try {
		await Dao.execute_value(request.pg, sql)
	} catch (e) {
		log.error(`An exception occurred while updating login log : ${e?.message}`)
	}
}

module.exports = route_controller
