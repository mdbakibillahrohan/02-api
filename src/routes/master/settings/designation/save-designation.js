"use strict"

const uuid = require("uuid");
const _ = require("underscore")
const Joi = require("@hapi/joi")
const Dao = require("../../../../util/dao")
const log = require("../../../../util/log")
const { API, TABLE } = require("../../../../util/constant")

const payload_scheme = Joi.object({
	name: Joi.string().trim().min(1).max(128).required(),
	sort_order: Joi.string().trim().min(1).max(128).required(),
	status: Joi.string().trim().valid('Active', 'Inactive').required(),

})

const route_controller = {
	method: "POST",
	path: API.CONTEXT + API.MASTER_SETTING_DESIGNATION_SAVE_PATH,
	options: {
		auth: {
			mode: "required",
			strategy: "jwt",
		},
		description: "Save Designation",
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
		return { status: false, code: 201, message: `Unable to save designation` }
	}
	log.info(`[${request.auth.credentials.company_oid}/${request.auth.credentials.login_id}] - designation save - ${request.payload.name}`)
	return { status: true, code: 200, message: `Successfully save ${request.payload.name}` }
	
}

const post_data = async (request) => {
    let cols = [ 'oid', 'name', 'sort_order', 'status', 'company_oid', 'created_on', 'created_by' ]

    let params = ['$1', '$2', '$3', '$4', '$5', '$6', '$7']

	let data = [uuid.v4(), request.payload.name, request.payload.sort_order, request.payload.status, request.auth.credentials.company_oid, 'now()', request.auth.credentials.login_id ]

    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.DESIGNATION} (${scols}) values (${sparams})`

	let sql = {
		text: query,
		values: data,
	}
	try {
		const data_set =  await Dao.execute_value(request.pg, sql)
		console.log(data_set)
		return data_set['rowCount'] >= 0 ? data_set['rowCount'] : null
	} catch (e) {
		log.error(`An exception occurred while saving designation : ${e?.message}`)
	}
	
}

module.exports = route_controller
