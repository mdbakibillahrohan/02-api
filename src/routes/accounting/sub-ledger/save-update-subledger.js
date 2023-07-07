"use strict"

const _ = require("underscore")
const Joi = require("@hapi/joi")
const Dao = require("../../../util/dao")
const log = require("../../../util/log")
const { API } = require("../../../util/constant")

const payload_scheme = Joi.object({
	oid: Joi.string().trim().min(1).max(128).optional(),
    subledger_name: Joi.string().trim().min(1).max(128).required(),
    ledger_oid: Joi.string().trim().min(1).max(128).required(),
    initial_balance: Joi.number().required(),
	status: Joi.string().valid("Active", "Inactive").required(),
})

const route_controller = {
	method: "POST",
	path: API.CONTEXT + API.ACCOUNTING_SUBLEDGER_SAVE_UPDATE_PATH,
	options: {
		auth: {
			mode: "required",
			strategy: "jwt",
		},
		description: "save/update subledger",
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
		return { status: false, code: 201, message: `Unable to save/update subledger` }
	}
	log.info(`[${request.auth.credentials.company_oid}/${request.auth.credentials.login_id}] - subledger save/update - ${request.payload.subledger_name}`)
	return { status: true, code: 200, message: `Successfully executed subledger - ${request.payload.subledger_name}` }
}

const post_data = async (request) => {
	let data = null
	let param = _.clone(request.payload)
	param = _.extend(param, {
		created_by: request.auth.credentials.login_id
	})
	let sql = {
		text: `select save_update_subledger($1) as data`,
		values: [param],
	}
	try {
		let data_set = await Dao.get_data(request.pg, sql)
		data = data_set.length > 0 ? data_set[0]['data'] : null
	} catch (e) {
		log.error(`An exception occurred while saving/updating subledger : ${e?.message}`)
	}
	return data
}

module.exports = route_controller
