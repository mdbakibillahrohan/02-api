"use strict"

const _ = require("underscore")
const Joi = require("@hapi/joi")
const Dao = require("../../../util/dao")
const log = require("../../../util/log")
const { API, TABLE } = require("../../../util/constant")

const payload_scheme = Joi.object({
	offset: Joi.number().optional().allow(null, ""),
	limit: Joi.number().optional().allow(null, ""),
	search_text: Joi.string().trim().allow(null, "").optional(),
	status: Joi.array().items(Joi.string().trim().allow(null, '').valid('Active', 'Inactive').required()).optional(),
	people_type: Joi.array().items(Joi.string().trim().optional().allow(null, '').valid('Employee', 'Customer', 'Supplier')).optional(),
})
const route_controller = {
	method: "POST",
	path: API.CONTEXT + API.MASTER_PEOPLE_GET_LIST_PATH,
	options: {
		auth: {
			mode: "required",
			strategy: "jwt",
		},
		description: "get people list",
		plugins: { hapiAuthorization: false },
		validate: {
			query: payload_scheme,
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
	let count = await get_count(request)
	let data = await get_data(request)
	if (count == 0) {
		log.warn(`[${request.auth.credentials.company_oid}/${request.auth.credentials.login_id}] - no people found`)
		return { status: false, code: 201, message: `No data found` }
	}
	log.info(`[${request.auth.credentials.company_oid}/${request.auth.credentials.login_id}] - ${count} people found`)
	return { status: true, code: 200, message: `Successfully get people list`, total: count, data: data }
}

const get_count = async (request) => {
	let index = 1
	let data, param = []
	let query = `select count(*)::int4 as total from ${TABLE.PEOPLE} 
		where 1 = 1 and company_oid = $${index++}`

	if (request.payload.status && request.payload.status.length > 0) {
		let status = request.payload.status.map((x) => `'${x}'`).join(", ")
		query += ` and status in (${status})`
	}


	if (request.payload.people_type && request.payload.people_type.length > 0) {
		let people_type = request.payload.people_type.map((x) => `people_type::text ilike '%${x}%'`).join(' or ')
		query += ` and (${people_type})`
	}

	if (request.payload.search_text && request.payload.search_text.length > 0) {
		query += ` and (lower(name) ilike $${index} or lower(email) ilike $${index} or lower(mobile_no) ilike $${index++})`
		param.push(`%${request.payload.search_text}%`)
	}

	let sql = {
		text: query,
		values: param,
	}
	try {
		let data_set = await Dao.get_data(request.pg, sql)
		data = data_set[0]["total"]
	} catch (e) {
		log.error(`An exception occurred while getting people list count : ${e?.message}`)
	}
	return data
}

const get_data = async (request) => {
	let index = 1
	let data, param = []
	let query = `select p.oid, p.name, p.email, p.company_oid, p.address,
		p.status, p.image_path, p.mobile_no, p.payable_balance::float8, 
		p.receivable_balance::float8, c.name as company_name, 
		d.name as designation, dp.name as department, (
			select string_agg(trim(json_string::text, '"'), ', ')
			from json_array_elements(p.people_type) json_string
		) as people_type from ${TABLE.PEOPLE} p
		left join ${TABLE.COMPANY} c on p.company_oid = c.oid
		left join ${TABLE.DESIGNATION} d on p.designation_oid = d.oid
		left join ${TABLE.DEPARTMENT} dp on p.department_oid = dp.oid
		where 1 = 1 and p.company_oid = $${index++}`

	param.push(request.auth.credentials.company_oid)

	if (request.payload.status && request.payload.status.length > 0) {
		let status = request.payload.status.map((x) => `'${x}'`).join(", ")
		query += ` and status in (${status})`
	}

	if (request.payload.people_type && request.payload.people_type.length > 0 ) {
		let people_type = request.payload.people_type.map((x) => `people_type::text ilike '%${x}%'`).join(' or ')
		query += ` and (${people_type})`
	}

	if (request.payload.search_text && request.payload.search_text.length > 0) {
		query += ` and (lower(p.name) ilike $${index} or lower(p.email) ilike $${index} or lower(p.mobile_no) ilike $${index++})`
		param.push(`%${request.payload.search_text}%`)

	}

	query += ` order by p.created_on desc`
	if (request.payload.limit && request.payload.offset) {
		query += ` limit $${index++} offset $${index++}`
		param.push(request.payload.limit)
		param.push(request.payload.offset)
	}

	let sql = {
		text: query,
		values: param,
	}
	try {
		data = await Dao.get_data(request.pg, sql)
	} catch (e) {
		log.error(`An exception occurred while getting people list : ${e?.message}`)
	}
	return data
}

module.exports = route_controller
