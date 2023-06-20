"use strict"

const _ = require("underscore")
const Joi = require("@hapi/joi")
const Dao = require("../../util/dao")
const log = require("../../util/log")
const { API, TABLE } = require("../../util/constant")

const payload_scheme = Joi.object({
	oid: Joi.string().min(1).allow(null, "").max(128).required(),
	name: Joi.string().trim().min(1).max(128).required(),
	email: Joi.string().trim().min(1).max(128).allow(null, '').optional(),
	mobile_no: Joi.string().trim().min(1).max(128).allow(null, '').optional(),
	designation_oid: Joi.string().trim().min(1).max(128).optional(),
	department_oid: Joi.string().trim().min(1).max(128).optional(),
	receivable_balance: Joi.number().optional(),
	payable_balance: Joi.number().optional(),
	address: Joi.string().trim().min(1).allow(null, '').optional(),
	image_path: Joi.string().trim().min(1).max(128).allow(null, '').optional(),
	status: Joi.string().trim().valid('Active', 'Inactive').required(),
	people_type: Joi.array().items(Joi.string().trim().optional().allow(null, '').valid('Employee', 'Customer', 'Supplier')).optional(),
	people_json: Joi.array().items(Joi.string().trim().optional().allow(null, '')).optional(),
})

const route_controller = {
	method: "POST",
	path: API.CONTEXT + API.PEOPLE_UPDATE_PATH,
	options: {
		auth: {
			mode: "required",
			strategy: "jwt",
		},
		description: "update people",
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
		return { status: false, code: 201, message: `Unable to update people` }
	}
	log.info(`[${request.auth.credentials.company_oid}/${request.auth.credentials.login_id}] - people update - ${request.payload.name}`)
	return { status: true, code: 200, message: `Successfully update ${request.payload.name}` }
}

const post_data = async (request) => {
    let cols = ['name = $1', 'status = $2', 'edited_on = $3 ', 'edited_by = $4' ]
	let data = [ request.payload.name, request.payload.status, 'now()', request.auth.credentials.login_id ]
	let index = 5

	if(request.payload.email){
		cols.push(`email = $${index++}`)
		data.push(request.payload.email)
	}
	if(request.payload.mobile_no){
		cols.push(`mobile_no = $${index++}`)
		data.push(request.payload.mobile_no)
	}	
	if(request.payload.address){
		cols.push(`address = $${index++}`)
		data.push(request.payload.address)
	}	
	if(request.payload.people_type){
		let people_type = request.payload.people_type.map((x) => `${x}`).join(", ")
		cols.push(`people_type = $${index++}`)
		data.push(`["${people_type}"]`)
	}	
	if(request.payload.receivable_balance){
		cols.push(`receivable_balance = $${index++}`)
		data.push(request.payload.receivable_balance)
	}	
	if(request.payload.people_json){
		cols.push(`people_json = $${index++}`)
		data.push(request.payload.people_json)
	}	
	if(request.payload.payable_balance){
		cols.push(`payable_balance = $${index++}`)
		data.push(request.payload.payable_balance)
	}	
	if(request.payload.image_path){
		cols.push(`image_path = $${index++}`)
		data.push(request.payload.image_path)
	}	
	if(request.payload.department_oid){
		cols.push(`department_oid = $${index++}`)
		data.push(request.payload.department_oid)
	}	
	if(request.payload.designation_oid){
		cols.push(`designation_oid = $${index++}`)
		data.push(request.payload.designation_oid)
	}
    let scols = cols.join(', ')
    let query = `update ${TABLE.PEOPLE} set ${scols} where 1 = 1 and
		oid = $${index++} and company_oid = $${index++}`

	data.push(request.payload.oid)
	data.push(request.auth.credentials.company_oid)

	let sql = {
		text: query,
		values: data,
	}
	try {
		const data_set =  await Dao.execute_value(request.pg, sql)
		return data_set['rowCount'] >= 0 ? data_set['rowCount'] : null
	} catch (e) {
		log.error(`An exception occurred while updating people : ${e?.message}`)
	}
}

module.exports = route_controller
