"use strict"

const Joi = require("@hapi/joi")
const Dao = require("../../../util/dao")
const log = require("../../../util/log")
const { API, TABLE } = require("../../../util/constant")

const payload_scheme = Joi.object({
	oid: Joi.string().trim().min(1).max(128).required(),
	account_no: Joi.string().trim().min(1).max(128).required(),
	account_name: Joi.string().trim().min(1).max(128).required(),
	branch_name: Joi.string().trim().min(1).max(128).required(),
	initial_balance: Joi.string().trim().min(1).max(128).optional(),
	bank_oid: Joi.string().trim().min(1).max(128).required(),
	status: Joi.string().trim().valid('Active', 'Inactive').required(),

})

const route_controller = {
	method: "POST",
	path: API.CONTEXT + API.MASTER_BANK_ACCOUNT_UPDATE_PATH,
	options: {
		auth: {
			mode: "required",
			strategy: "jwt",
		},
		description: "Update bank account",
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
		return { status: false, code: 201, message: `Unable to update bank account` }
	}	
	log.info(`[${request.auth.credentials.company_oid}/${request.auth.credentials.login_id}] - bank account update - ${request.payload.account_name}`)
	return { status: true, code: 200, message: `Successfully update ${request.payload.account_name}` }
}

const post_data = async (request) => {
    let cols = [ 'account_no = $1', 'account_name = $2', 'branch_name = $3', 
		'status = $4', 'bank_oid = $5' ]

	let data = [request.payload.account_no, request.payload.account_name, request.payload.branch_name, request.payload.status, request.payload.bank_oid]
    let index = 6;	
	if(request.payload.initial_balance){
		cols.push(`initial_balance = $${index++}`)
		data.push(request.payload.initial_balance)
	}
    let scols = cols.join(', ')
	
    let query = `update ${TABLE.BANK_ACCOUNT} set ${scols} where 1 = 1 and oid = $${index++} and company_oid = $${index++}`

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
		log.error(`An exception occurred while updating bank account : ${e?.message}`)
	}
	
}

module.exports = route_controller
