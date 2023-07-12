"use strict"

const _ = require("underscore")
const Joi = require("@hapi/joi")
const Dao = require("../../util/dao")
const log = require("../../util/log")
const { API } = require("../../util/constant")

const payload_scheme = Joi.object({
	oid: Joi.string().trim().min(1).max(128).optional(),
    name: Joi.string().trim().min(1).max(128).required(),
    people_type: Joi.array().items(Joi.string().valid("Customer", "Vendor", "Employee")).required(),
    mobile_no: Joi.string().trim().min(1).max(20).required(),
    email: Joi.string().email().required(),
    address: Joi.string().trim().min(1).optional(),
	status: Joi.string().valid("Active", "Inactive").required(),

    receivable_balance: Joi.number().optional(),
    discount_type: Joi.string().valid("Pct", "Fixed").optional(),

    payable_balance: Joi.number().optional(),

    department_oid:Joi.string().trim().min(1).max(128).optional(),
    designation_oid: Joi.string().trim().min(1).max(128).optional(),
})

const route_controller = {
	method: "POST",
	path: API.CONTEXT + API.PEOPLE_SAVE_UPDATE_PATH,
	options: {
		auth: {
			mode: "required",
			strategy: "jwt",
		},
		description: "save/update people",
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
		return { status: false, code: 201, message: `Unable to save/update people` }
	}
	log.info(`[${request.auth.credentials.company_oid}/${request.auth.credentials.login_id}] - people save/update - ${request.payload.name}`)
	return { status: true, code: 200, message: `Successfully executed people - ${request.payload.name}` }
}

const post_data = async (request) => {
	let data = null
	let param = _.clone(request.payload)
	param = _.extend(param, {
		created_by: request.auth.credentials.login_id
	})
	let sql = {
		text: `select save_update_people($1) as data`,
		values: [param],
	}
	try {
		let data_set = await Dao.get_data(request.pg, sql)
		data = data_set.length > 0 ? data_set[0]['data'] : null
	} catch (e) {
		log.error(`An exception occurred while saving/updating people : ${e?.message}`)
	}
	return data
}

module.exports = route_controller
