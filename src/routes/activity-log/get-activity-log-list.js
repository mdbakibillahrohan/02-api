"use strict"

const Joi = require("@hapi/joi")
const Dao = require("../../util/dao")
const log = require("../../util/log")
const { API, TABLE,} = require("../../util/constant")

const payload_scheme = Joi.object({
	from_date: Joi.string().trim().length(10).optional().allow(null, ""),
	to_date: Joi.string().trim().length(10).optional().allow(null, ""),
	offset: Joi.number().optional(),
	limit: Joi.number().required(),
	search_text: Joi.string().trim().optional().allow(null, ""),
	reference_name: Joi.string().trim().optional().allow(null, ""),
})

const route_controller = {
	method: "POST",
	path: API.CONTEXT + API.GET_ACTIVITY_LOG_LIST,
	options: {
		auth: {
			mode: "required",
			strategy: "jwt",
		},
		description: "get activity log list",
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
	let count = await get_count(request)
	let data = await get_data(request)

	if (count == 0) {
		log.warn(`[${request.auth.credentials.company_oid}/${request.auth.credentials.login_id}] - no activity log found`)
		return { status: false, code: 201, message: `No data found` }
	}

	log.info(`[${request.auth.credentials.company_oid}/${request.auth.credentials.login_id}] - ${count} activity log found`)
	return { status: true, code: 200, message: `Successfully get activity log list`, total: count, data: data, }
}


const get_data = async (request) => {
	let idx = 1
	let data, param = []
	let query = `select  reference_id, reference_name, description,
		to_char(created_on, 'YYYY-MM-DD HH24:MI:SS.MS') as created_on
      	from ${TABLE.ACTIVITY_LOG}
       	where 1 = 1 and company_oid = $${idx++}`
	param.push(request.auth.credentials.company_oid)

	if (request.payload.reference_name) {
		query += ` and reference_name = $${idx++}`
		param.push(request.payload.reference_name)
	}

	if (request.payload.from_date && request.payload.to_date) {
		query += ` and date(created_on) between $${idx++} and $${idx++}`
		param.push(request.payload.from_date)
		param.push(request.payload.to_date)
	}

	if (request.payload.search_text && request.payload.search_text.length > 0) {
		query += ` and reference_id ilike $${idx++}`
		param.push(`%${request.payload.search_text}%`)
	}
	
	query += ` order by created_on desc limit $${idx++}`
	param.push(request.payload.limit)
	if(request.payload.offset && request.payload.offset>0){
		query += ` offset $${idx++}`
		param.push(request.payload.offset)
	}

	let sql = {
		text: query,
		values: param,
	}

	try {
		data = await Dao.get_data(request.pg, sql)
	} catch (e) {
		log.error(`An exception occurred while getting activity log list : ${e?.message}`)
	}
	return data
}

const get_count = async (request) => {
	let data = 0
	let idx = 1
	let param = []
	let query = `select count(ac.*)::int4 as total
		from ${TABLE.ACTIVITY_LOG} ac
		where 1 = 1 and ac.company_oid = $${idx++}`

	param.push(request.auth.credentials.company_oid)

	if (request.payload.reference_name) {
		query += ` and reference_name = $${idx++}`
		param.push(request.payload.reference_name)
	}

	if (request.payload.from_date && request.payload.to_date) {
		query += ` and date(created_on) between $${idx++} and $${idx++}`
		param.push(request.payload.from_date)
		param.push(request.payload.to_date)
	}

	if (request.payload.search_text && request.payload.search_text.length > 0) {
		query += ` and reference_id ilike $${idx++}`
		param.push(`%${request.payload.search_text}%`)
	}

	let sql = {
		text: query,
		values: param,
	}
	try {
		let data_set = await Dao.get_data(request.pg, sql)
		data = data_set.length > 0 ? data_set[0]['total'] : 0
	} catch (e) {
		log.error(`An exception occurred while getting activity log count : ${e?.message}`)
	}
	return data
}

module.exports = route_controller
