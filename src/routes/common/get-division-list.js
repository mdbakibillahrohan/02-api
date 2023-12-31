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
	path: API.CONTEXT + API.GET_DIVISION_LIST,
	options: {
		auth: {
			mode: "required",
			strategy: "jwt",
		},
		description: "get division list by any text",
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
		log.warn(`division list not found`)
		return { status: false, code: 201, message: `No data found` }
	}
	log.info(`[${request.auth.credentials.company_oid}/${request.auth.credentials.login_id}] - get division list`)
	return { status: true, code: 200, message: `Successfully get division list`, data: data }
}

const get_data = async (request) => {
	let index = 1
	let data, param = []
	let query = `select oid, division_code, name_en, name_bn
		from ${TABLE.DIVISION} where 1 = 1 `

	if (request.payload.search_text) {
		query += ` and (lower(division_code) ilike $${index} or lower(name_en) ilike $${index} or lower(name_bn) ilike $${index++})`
		param.push(`%${request.payload.search_text}%`)
	}
	let sql = {
		text: query,
		values: param,
	}
	try {
		data = await Dao.get_data(request.pg, sql)
	} catch (e) {
		log.error(`An exception occurred while getting division list : ${e?.message}`)
	}
	return data
}

module.exports = route_controller
