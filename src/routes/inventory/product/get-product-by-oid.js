"use strict"

const _ = require("underscore")
const Joi = require("@hapi/joi")
const log = require("../../../util/log")
const Dao = require("../../../util/dao")
const { API, TABLE } = require("../../../util/constant")

const payload_scheme = Joi.object({
	oid: Joi.string().trim().min(1).max(128).required()
})

const route_controller = {
	method: "POST",
	path: API.CONTEXT + API.INVENTORY_PRODUCT_GET_BY_OID_PATH,
	options: {
		auth: {
			mode: "required",
			strategy: "jwt",
		},
		description: "get product by oid",
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
	if (data == null) {
		log.warn(`Unable to get product information by oid - ${request.payload.oid}`)
		return { status: false, code: 201, message: "Not found product information", data: data }
	}
	log.info(`Get product information by oid - ${request.payload.oid}`)
	return { status: true, code: 200, message: "Successfully get product information by oid", data: data }
}

const get_data = async (request) => {
	let data = null
	let sql = {
		text: `select p.oid, p.name, product_type, selling_price, purchase_price, minimum_qty, initial_qty, initial_value, p.status, pu.name as product_unit, pc.name as product_category, pu.oid as product_unit_oid, pc.oid as product_category_oid from ${TABLE.PRODUCT} p
        LEFT JOIN ${TABLE.PRODUCT_UNIT} pu on pu.oid = p.product_unit_oid 
        LEFT JOIN ${TABLE.PRODUCT_CATEGORY} pc on pc.oid = p.product_category_oid 
            where 1 = 1 and p.oid = $1 and p.company_oid = $2`,
		values: [request.payload.oid, request.auth.credentials.company_oid],
	}
	try {
		let data_set = await Dao.get_data(request.pg, sql)
		data = data_set.length > 0 ? data_set[0] : null
	} catch (e) {
		log.error(`An exception occurred while getting product information by oid : ${e?.message}`)
	}
	return data
}

module.exports = route_controller