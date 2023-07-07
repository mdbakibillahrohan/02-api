"use strict"

const Joi = require("@hapi/joi")
const Dao = require("../../../util/dao")
const log = require("../../../util/log")
const { API, TABLE } = require("../../../util/constant")

const payload_scheme = Joi.object({
    ledger_subgroup_oid: Joi.string().trim().min(1).max(128).required(),
})

const route_controller = {
	method: "POST",
	path: API.CONTEXT + API.ACCOUNTING_LEDGER_BY_SUBGROUP_GET_LIST_PATH,
	options: {
		auth: {
			mode: "required",
			strategy: "jwt",
		},
		description: "Get ledger list by ledger subgroup",
		plugins: { hapiAuthorization: false },
		validate: {
            payload: payload_scheme,
			options: {
				allowUnknown: false,
			},
			failAction: async (request, h, err) => {
				return h
					.response({ code: 301, status: false, message: err?.message }).takeover()
			},
		},
	},
	handler: async (request, h) => {
		log.debug(`Request received - ${JSON.stringify(request.query)}`)
		const response = await handle_request(request)
		log.debug(`Response sent - ${JSON.stringify(response)}`)
		return h.response(response)
	},
}

const handle_request = async (request) => {
	let data = await get_data(request)
	if (data.length == 0) {
		return { status: false, code: 201, message: "No data found" }
	}
	log.info(`Ledger list by ledger subgroup data found`)
	return { status: true, code: 200, message: "Successfully get ledger list by ledger subgroup", data: data }
}

const get_data = async (request) => {
	let data = []
	let param = [request.auth.credentials.company_oid, request.payload.ledger_subgroup_oid]
	let query = `select oid, ledger_name from ${TABLE.LEDGER} 
            where company_oid = $1 and ledger_subgroup_oid = $2`
	let sql = {
		text: query,
		values: param,
	}
	try {
		data = await Dao.get_data(request.pg, sql)
	} catch (e) {
		log.error(`An exception occurred while getting ledger list by ledger subgroup: ${e?.message}`)
	}
	return data
}

module.exports = route_controller
