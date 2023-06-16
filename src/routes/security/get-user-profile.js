"use strict"

const _ = require("underscore")
const Dao = require("../../util/dao")
const log = require("../../util/log")
const { API, TABLE } = require("../../util/constant")

const route_controller = {
	method: "GET",
	path: API.CONTEXT + API.USER_PROFILE_INFO,
	options: {
		auth: {
			mode: "required",
			strategy: "jwt",
		},
        description: "get user profile",
        plugins: { hapiAuthorization: false },
	},
	handler: async (request, h) => {
		const response = await handle_request(request)
		log.debug(`Response sent - ${JSON.stringify(response)}`)
		return h.response(response)
	},
}

const handle_request = async (request) => {
	let data = await get_data(request)
	if (data == null) {
		return { code: 201, status: false, message: `No data found` }
	}
	log.info(`[${data["company_oid"]}/${data["login_id"]}] - user profile found`)
	return { status: true, code: 200, data: data }
}

const get_data = async (request) => {
	let data = null
	let sql = {
		text: `select l.login_id, l.name, r.menu_json ,
			l.company_oid, r.role_id as "role",
			(select c.name from ${TABLE.COMPANY} c where c.oid = l.company_oid) as "company_name"
			from ${TABLE.LOGIN} l
			left join ${TABLE.ROLE} r on r.oid = l.role_oid
			where 1 = 1 and l.login_id = $1`,
		values: [request.auth.credentials.login_id],
	}
	try {
		let data_set = await Dao.get_data(request.pg, sql)
		data = data_set.length > 0 ? data_set[0] : null
	} catch (e) {
		log.error(`An exception occurred while getting user profile : ${e?.message}`)
	}
	return data
}

module.exports = route_controller
