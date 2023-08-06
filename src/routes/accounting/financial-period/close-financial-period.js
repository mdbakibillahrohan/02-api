"use strict"

const _ = require("underscore")
const Joi = require("@hapi/joi")
const Dao = require("../../../util/dao")
const log = require("../../../util/log")
const { API } = require("../../../util/constant")

const payload_scheme = Joi.object({
	oid: Joi.string().trim().min(1).max(128).optional(),

})

const route_controller = {
	method: "POST",
	path: API.CONTEXT + API.ACCOUNTING_CLOSE_FINANCIAL_PERIOD_PATH,
	options: {
		auth: {
			mode: "required",
			strategy: "jwt",
		},
		description: "close financial period",
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
	if (res_data == false) {
		return { status: false, code: 201, message: `Unable to close financial period` }
	}
	log.info(`[${request.auth.credentials.company_oid}/${request.auth.credentials.login_id}] - financial period close - ${request.payload.oid}`)
	return { status: true, code: 200, message: `Successfully executed close financial period - ${request.payload.oid}` }
}

const post_data = async (request) => {
	let data = false
	let param = _.clone(request.payload)
	param = _.extend(param, {
		created_by: request.auth.credentials.login_id
	})
	let sql = {
		text: `select close_financial_period($1) as data`,
		values: [param],
	}
	try {
		await Dao.execute_value(request.pg, sql)
		data = true
	} catch (e) {
		log.error(`An exception occurred while closing financial period : ${e?.message}`)
	}
	return data
}

module.exports = route_controller
