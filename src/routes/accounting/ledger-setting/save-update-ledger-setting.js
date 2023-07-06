"use strict"

const _ = require("underscore")
const Joi = require("@hapi/joi")
const Dao = require("../../../util/dao")
const log = require("../../../util/log")
const { API, TABLE } = require("../../../util/constant")

const payload_scheme = Joi.object({
	oid: Joi.string().trim().min(1).max(128).optional(),
	ledger_key: Joi.string().trim().min(1).max(128).required(),
	ledger_name: Joi.string().trim().min(1).max(128).required(),
	ledger_oid: Joi.string().trim().min(1).max(32).required()
})

const route_controller = {
	method: "POST",
	path: API.CONTEXT + API.ACCOUNTING_LEDGER_SETTING_SAVE_UPDATE_PATH,
	options: {
		auth: {
			mode: "required",
			strategy: "jwt",
		},
		description: "save/update ledger setting",
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
		return { status: false, code: 201, message: `Unable to save/update ledger setting` }
	}
	log.info(`[${request.auth.credentials.company_oid}/${request.auth.credentials.login_id}] - ledger setting save/update - ${request.payload.ledger_name}`)
	return { status: true, code: 200, message: `Successfully executed ledger setting ${request.payload.ledger_name}` }
}

const post_data = async (request) => {
	let data = null
	let param = _.clone(request.payload)
	param = _.extend(param, {
		created_by: request.auth.credentials.login_id
	})
	
	let sql = {
		text: `select save_update_ledger_setting($1) as data`,
		values: [param],
	}
	try {
		let data_set = await Dao.get_data(request.pg, sql)
		data = data_set.length > 0 ? data_set[0]['data'] : null
	} catch (e) {
		log.error(`An exception occurred while saving ledger setting : ${e?.message}`)
	}
	return data
}

module.exports = route_controller
