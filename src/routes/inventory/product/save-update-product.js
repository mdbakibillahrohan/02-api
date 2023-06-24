"use strict"

const _ = require("underscore")
const Joi = require("@hapi/joi")
const Dao = require("../../../util/dao")
const log = require("../../../util/log")
const { API } = require("../../../util/constant")

const payload_scheme = Joi.object({
	oid: Joi.string().trim().min(1).max(128).optional(),
    name: Joi.string().trim().min(1).max(128).required(),
    product_type: Joi.string().trim().valid("Product", "Service").required(),
    selling_price: Joi.number().optional(),
    purchase_price: Joi.number().optional(),
    minimum_qty: Joi.number().required(),
    initial_qty: Joi.number().required(),
    initial_value: Joi.number().required(),
    status: Joi.string().trim().valid("Active", "Inactive").required(),
    product_unit_oid: Joi.string().trim().min(1).max(128),
    product_category_oid: Joi.string().trim().min(1).max(128)
})

const route_controller = {
	method: "POST",
	path: API.CONTEXT + API.INVENTORY_PRODUCT_SAVE_UPDATE_PATH,
	options: {
		auth: {
			mode: "required",
			strategy: "jwt",
		},
		description: "save/update product",
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
		return { status: false, code: 201, message: `Unable to save/update product` }
	}
	log.info(`[${request.auth.credentials.company_oid}/${request.auth.credentials.login_id}] - product save/update - ${request.payload.name}`)
	return { status: true, code: 200, message: `Successfully executed product - ${request.payload.name}` }
}

const post_data = async (request) => {
	let data = null
	let param = _.clone(request.payload)
	param = _.extend(param, {
		created_by: request.auth.credentials.login_id
	})
	let sql = {
		text: `select save_update_product($1) as data`,
		values: [param],
	}
	try {
		let data_set = await Dao.get_data(request.pg, sql)
		data = data_set.length > 0 ? data_set[0]['data'] : null
	} catch (e) {
		log.error(`An exception occurred while saving/updating product : ${e?.message}`)
	}
	return data
}

module.exports = route_controller
