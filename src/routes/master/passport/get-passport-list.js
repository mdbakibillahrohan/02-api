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
	status: Joi.string().trim().allow(null, '').valid('Active', 'Inactive').optional(),
	issuing_authority: Joi.string().trim().min(1).max(128).optional(),
	country_code: Joi.string().trim().min(1).max(128).optional(),
	country: Joi.string().trim().min(1).max(128).optional(),

})
const route_controller = {
	method: "POST",
	path: API.CONTEXT + API.MASTER_PASSPORT_GET_LIST_PATH,
	options: {
		auth: {
			mode: "required",
			strategy: "jwt",
		},
		description: "get passport list",
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
		log.warn(`[${request.auth.credentials.company_oid}/${request.auth.credentials.login_id}] - no passport found`)
		return { status: false, code: 201, message: `No data found` }
	}
	log.info(`[${request.auth.credentials.company_oid}/${request.auth.credentials.login_id}] - ${count} passport found`)
	return { status: true, code: 200, message: `Successfully get passport list`, total: count, data: data }
}

const get_count = async (request) => {
	let index = 1
	let data, param = []
	let query = `select count(*)::int4 as total from ${TABLE.PASSPORT} pa
		left join ${TABLE.COMPANY} cm on pa.company_oid = cm.oid
		left join ${TABLE.COUNTRY} cu on pa.country_oid = cu.oid
		left join ${TABLE.PEOPLE} pe on pa.people_oid = pe.oid
		where 1 = 1 and pa.company_oid = $${index++}`

	param.push(request.auth.credentials.company_oid)

	if (request.payload.status ) {
		query += ` and pa.status = $${index++}`
		param.push(request.payload.status)
	}
	if (request.payload.country_code ) {
		query += ` and pa.country_code = $${index++}`
		param.push(request.payload.country_code)
	}
	if (request.payload.country ) {
		query += ` and cu.name = $${index++}`
		param.push(request.payload.country)
	}

	if (request.payload.issuing_authority ) {
		query += ` and pa.issuing_authority = $${index++}`
		param.push(request.payload.issuing_authority)
	}

	if (request.payload.search_text) {
		query += ` and (lower(pa.full_name) ilike $${index} or 
            lower(pe.name) ilike $${index} or 
            lower(pa.sur_name) ilike $${index} or
            lower(pa.given_name) ilike $${index} or 
            lower(pa.passport_number) ilike $${index} or 
            lower(pa.email) ilike $${index} or 
            lower(pa.previous_passport_number) ilike $${index} or
            lower(pa.mobile_no) ilike $${index++})`
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
		log.error(`An exception occurred while getting passport list count : ${e?.message}`)
	}
	return data
}

const get_data = async (request) => {
	let index = 1
	let data, param = []
	let query = `select pa.oid, pa.passenger_id, pa.full_name, pa.sur_name, 
        pa.given_name, pa.gender, pa.mobile_no, pa.email, pa.nationality,
        pa.country_code, pa.birth_registration_no, pa.personal_no, pa.passport_number, pa.previous_passport_number, pa.birth_date, pa.passport_issue_date, pa.passport_expiry_date, pa.passport_image_path, pa.issuing_authority, 
		pa.description, pa.passport_json, pa.status, cm.name as company_name, cu.name as country, pe.name as people_name from ${TABLE.PASSPORT} pa
		left join ${TABLE.COMPANY} cm on pa.company_oid = cm.oid
		left join ${TABLE.COUNTRY} cu on pa.country_oid = cu.oid
		left join ${TABLE.PEOPLE} pe on pa.people_oid = pe.oid
		where 1 = 1 and pa.company_oid = $${index++}`

	param.push(request.auth.credentials.company_oid)

	if (request.payload.status ) {
		query += ` and pa.status = $${index++}`
		param.push(request.payload.status)
	}
	if (request.payload.country_code ) {
		query += ` and pa.country_code = $${index++}`
		param.push(request.payload.country_code)
	}
	if (request.payload.country ) {
		query += ` and cu.name = $${index++}`
		param.push(request.payload.country)
	}

	if (request.payload.oid ) {
		query += ` and pa.issuing_authority = $${index++}`
		param.push(request.payload.oid)
	}

	if (request.payload.search_text) {
		query += ` and (lower(pa.full_name) ilike $${index} or 
            lower(pe.name) ilike $${index} or 
            lower(pa.sur_name) ilike $${index} or
            lower(pa.given_name) ilike $${index} or 
            lower(pa.passport_number) ilike $${index} or 
            lower(pa.email) ilike $${index} or 
            lower(pa.previous_passport_number) ilike $${index} or
            lower(pa.mobile_no) ilike $${index++})`
		param.push(`%${request.payload.search_text}%`)
	}

	query += ` order by pa.created_on desc`

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
		log.error(`An exception occurred while getting passport list : ${e?.message}`)
	}
	return data
}

module.exports = route_controller