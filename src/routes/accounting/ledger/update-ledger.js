"use strict"

const _ = require("underscore")
const Joi = require("@hapi/joi")
const Dao = require("../../../util/dao")
const log = require("../../../util/log")
const { API, TABLE } = require("../../../util/constant")

const payload_scheme = Joi.object({
    ledger_name: Joi.string().trim().min(1).required(),
    ledger_code: Joi.string().trim().min(1).required(),

})

const route_controller = {
	method: "POST",
	path: API.CONTEXT + API.ACCOUNTING_LEDGER_UPDATE_PATH,
	options: {
		auth: {
			mode: "required",
			strategy: "jwt",
		},
		description: "update ledger",
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
	if (!res_data) {
		return { status: false, code: 201, message: `Unable to update ledger` }
	}
	log.info(`[${request.auth.credentials.company_oid}/${request.auth.credentials.login_id}] - ledger update - ${request.payload.ledger_name}`)
	return { status: true, code: 200, message: `Successfully executed ledger - ${request.payload.ledger_name}` }
}

const post_data = async (request) => {
	let data = false

	let sql = {
		text: `UPDATE ${TABLE.LEDGER} SET ledger_name = $1 WHERE ledger_code = $2`,
		values: [request.payload["ledger_name"], request.payload["ledger_code"]],
	}
	try {
	    await Dao.execute_value(request.pg, sql)
		data = true 
	} catch (e) {
		log.error(`An exception occurred while updating ledger : ${e?.message}`)
	}
	return data
}

module.exports = route_controller
