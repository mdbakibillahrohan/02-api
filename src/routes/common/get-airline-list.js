"use strict"

const _ = require("underscore")
const Joi = require("@hapi/joi")
const log = require("../../util/log")
const Dao = require("../../util/dao")
const { API, TABLE } = require("../../util/constant")

const payload_scheme = Joi.object({
	search_text: Joi.string().trim().required().allow(null, ''),
})

const route_controller = {
	method: "POST",
	path: API.CONTEXT + API.GET_AIRLINE_LIST,
	options: {
		auth: {
			mode: "required",
			strategy: "jwt",
		},
		description: "get ariline list by any text",
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
	if (data.length == 0) {
		log.warn(`airline list not found`)
		return { status: false, code: 201, message: `No data found` }
	}
	log.info(`[${request.auth.credentials.company_oid}/${request.auth.credentials.login_id}] - get airline list`)
	return { status: true, code: 200, message: `Successfully get airline list`, data: data }
}

const get_data = async (request) => {
	let index = 1
	let data, param = []
	let query = `select oid, airline_id, airline_name, alias_name, country, 
        iata, icao, callsign, status
		from ${TABLE.AIRLINE} where status = $${index++}`

	param.push('Active')

	if (request.payload.search_text) {
		query += ` and (lower(airline_name) ilike $${index} or lower(alias_name) ilike $${index} 
			or lower(country) ilike $${index} or lower(callsign) ilike $${index} or lower(iata) ilike $${index} or lower(icao) ilike $${index++})`
			
		param.push(`%${request.payload.search_text}%`)
	}
	let sql = {
		text: query,
		values: param,
	}
	try {
		data = await Dao.get_data(request.pg, sql)
	} catch (e) {
		log.error(`An exception occurred while getting airline list : ${e?.message}`)
	}
	return data
}

module.exports = route_controller
