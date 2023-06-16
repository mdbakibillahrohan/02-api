"use strict"

const Dao = require("../../util/dao")
const log = require("../../util/log")
const { API, SCHEMA, TABLE } = require("../../util/constant")

const route_controller = {
	method: "GET",
	path: API.CONTEXT + API.SIGNOUT,
	options: {
		auth: {
			mode: "required",
			strategy: "jwt",
		},
		description: "signout",
		plugins: { hapiAuthorization: false },
	},
	handler: async (request, h) => {
		const response = await handle_request(request)
		log.debug(`Response sent - ${JSON.stringify(response)}`)
		return h.response(response)
	},
}

const handle_request = async (request) => {
	let access_token = request.headers["authorization"].replace("Bearer ", "").trim()
	await post_data(request, access_token)
	log.info(`[${(request.auth.credentials.company_oid != null) ? request.auth.credentials.company_oid : 'CELAC'}/${request.auth.credentials.login_id}] - signout`)
	return { status: true, code: 200, message: `Successfully logout` }
}

const post_data = async (request, access_token) => {
	let sql = {
		text: `update ${SCHEMA.PUBLIC}.${TABLE.LOGIN_LOG} 
		set sign_out_time = clock_timestamp(), status = $2 
        where access_token = $1`,
		values: [access_token, "Signout"],
	}
	try {
		await Dao.execute_value(request.pg, sql)
	} catch (e) {
		log.error(`An exception occurred while updating login log : ${e?.message}`)
	}
}

module.exports = route_controller
