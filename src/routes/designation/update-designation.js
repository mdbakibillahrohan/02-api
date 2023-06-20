"use strict"

const Joi = require("@hapi/joi")
const Dao = require("../../util/dao")
const log = require("../../util/log")
const { API, TABLE } = require("../../util/constant")

const payload_scheme = Joi.object({
	oid: Joi.string().trim().min(1).max(128).required(),
	name: Joi.string().trim().min(1).max(128).required(),
	sort_order: Joi.string().trim().min(1).max(128).required(),
	status: Joi.string().trim().valid('Active', 'Inactive').required(),

})

const route_controller = {
	method: "POST",
	path: API.CONTEXT + API.DESIGNATION_UPDATE_PATH,
	options: {
		auth: {
			mode: "required",
			strategy: "jwt",
		},
		description: "Update Designation",
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
		return { status: false, code: 201, message: `Unable to update designation` }
	}	
	log.info(`[${request.auth.credentials.company_oid}/${request.auth.credentials.login_id}] - designation update - ${request.payload.name}`)
	return { status: true, code: 200, message: `Successfully update ${request.payload.name}` }
}

const post_data = async (request) => {
    let cols = [ 'name = $1', 'sort_order = $2', 'status = $3']

	let data = [request.payload.name, request.payload.sort_order, request.payload.status]
    let index = 4;
    let scols = cols.join(', ')
	
    let query = `update ${TABLE.DESIGNATION} set ${scols} where 1 = 1 and oid = $${index++} and company_oid = $${index++}`

    data.push(request.payload.oid)
    data.push(request.auth.credentials.company_oid)

	let sql = {
		text: query,
		values: data,
	}
	try {
		const data_set =  await Dao.execute_value(request.pg, sql)
		return data_set['rowCount'] >= 0? data_set['rowCount'] : null
	} catch (e) {
		log.error(`An exception occurred while updating designation : ${e?.message}`)
	}
	
}

module.exports = route_controller
