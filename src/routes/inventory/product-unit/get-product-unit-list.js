"use strict"

const Joi = require("@hapi/joi")
const Dao = require("../../../util/dao")
const log = require("../../../util/log")
const { API, TABLE } = require("../../../util/constant")

const payload_scheme = Joi.object({
	offset: Joi.number().optional().allow(null, ""),
	limit: Joi.number().optional().allow(null, ""),
	search_text: Joi.string().trim().allow(null, "").optional(),
	status: Joi.array().items(Joi.string().trim().required().valid('Active', 'Inactive')).optional(),

})
const route_controller = {
	method: "POST",
	path: API.CONTEXT + API.INVENTORY_PRODUCT_UNIT_GET_LIST_PATH,
	options: {
		auth: {
			mode: "required",
			strategy: "jwt",
		},
		description: "get product-unit list",
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
		log.warn(`[${request.auth.credentials.company_oid}/${request.auth.credentials.login_id}] - no product-unit found`)
		return { status: false, code: 201, message: `No data found` }
	}
	log.info(`[${request.auth.credentials.company_oid}/${request.auth.credentials.login_id}] - ${count} product-unit found`)
	return { status: true, code: 200, message: `Successfully get product-unit list`, total: count, data: data }
}

const get_count = async (request) => {
	let index = 1
	let data, param = []
	let query = `select count(*)::int4 as total from ${TABLE.PRODUCT_UNIT} 
		where 1 = 1 and company_oid = $${index++}`

	param.push(request.auth.credentials.company_oid)

	if (request.payload.status ) {
		query += ` and status = $${index++}`
        param.push(request.payload.status)
	}

	if (request.payload.search_text && request.payload.search_text.length > 0) {
		query += ` and (lower(name) ilike $${index} or lower(status) ilike $${index++})`
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
		log.error(`An exception occurred while getting product-unit list count : ${e?.message}`)
	}
	return data
}

const get_data = async (request) => {
	let index = 1
	let data, param = []
	let query = `select oid, name, status from ${TABLE.PRODUCT_UNIT} 
		where 1 = 1 and company_oid = $${index++}`

	param.push(request.auth.credentials.company_oid)

	if (request.payload.status) {
		query += ` and status = $${index++}`
        param.push(request.payload.status)
	}

	if (request.payload.search_text && request.payload.search_text.length > 0) {
		query += ` and (lower(name) ilike $${index} or lower(status) ilike $${index++})`

		param.push(`%${request.payload.search_text}%`)
	}


    if(request.payload.offset && request.payload.offset>0){
        query += ` offset $${index++}`
		param.push(request.payload.offset)
    }

	if (request.payload.limit) {
		query += ` limit $${index++}`
		param.push(request.payload.limit)
	}

	let sql = {
		text: query,
		values: param,
	}
	try {
		data = await Dao.get_data(request.pg, sql)
	} catch (e) {
		log.error(`An exception occurred while getting product-unit list : ${e?.message}`)
	}
	return data
}

module.exports = route_controller
