"use strict"

const _ = require("underscore")
const Joi = require("@hapi/joi")
const Dao = require("../../../util/dao")
const log = require("../../../util/log")
const { API, TABLE } = require("../../../util/constant")

const payload_scheme = Joi.object({
	oid: Joi.string().trim().min(1).max(128).required(),
})

const route_controller = {
	method: "POST",
	path: API.CONTEXT + API.MASTER_BANK_ACCOUNT_DELETE_PATH,
	options: {
		auth: {
			mode: "required",
			strategy: "jwt",
		},
		description: "delete bank account",
		plugins: { hapiAuthorization: false },
		validate: {
			payload: payload_scheme,
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
	let res_data = await post_data(request)
	if (res_data == null) {
		return { status: false, code: 201, message: `Unable to delete bank account` }
	}

	log.info(`[${request.auth.credentials.company_oid}/${request.auth.credentials.login_id}] - bank account delete - ${request.payload.oid}`)
	return { status: true, code: 200, message: `Successfully delete ${request.payload.oid}` }
	
}

const post_data = async (request) => {

    let query = `delete from ${TABLE.BANK_ACCOUNT} where 1 = 1 and oid = $1 and company_oid = $2`

	let sql = {
		text: query,
		values: [request.payload.oid, request.auth.credentials.company_oid],
	}
	try {
		const data_set =  await Dao.execute_value(request.pg, sql)
		return data_set['rowCount'] > 0 ? data_set['rowCount'] : null
	} catch (e) {
		log.error(`An exception occurred while deleting bank account : ${e?.message}`)
	}
}

module.exports = route_controller
