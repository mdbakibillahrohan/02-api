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
	path: API.CONTEXT + API.MASTER_PASSPORT_GET_BY_OID_PATH,
	options: {
		auth: {
			mode: "required",
			strategy: "jwt",
		},
		description: "get passport by oid",
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
		log.warn(`Unable to get passport information by oid - ${request.payload.oid}`)
		return { status: false, code: 201, message: "Not found passport information", data: data }
	}
	log.info(`Get passport information by oid - ${request.payload.oid}`)
	return { status: true, code: 200, message: "Successfully get passport information by oid", data: data }
}

const get_data = async (request) => {
	let data = null
	let sql = {
		text: `select oid, passenger_id, full_name, sur_name, 
        given_name, gender, mobile_no, email, nationality,
        country_code, birth_registration_no, personal_no, passport_number, previous_passport_number, birth_date, passport_issue_date, passport_expiry_date, passport_image_path, issuing_authority, description, passport_json, status, country_oid, people_oid from ${TABLE.PASSPORT} where oid = $1 and company_oid = $2`,
		values: [request.payload.oid, request.auth.credentials.company_oid],
	}
	try {
		let data_set = await Dao.get_data(request.pg, sql)
		data = data_set.length > 0 ? data_set[0] : null
	} catch (e) {
		log.error(`An exception occurred while getting passport information by oid : ${e?.message}`)
	}
	return data
}

module.exports = route_controller