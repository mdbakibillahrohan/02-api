"use strict"

const Joi = require("@hapi/joi")
const Dao = require("../../../util/dao")
const log = require("../../../util/log")
const { API, TABLE } = require("../../../util/constant")


const route_controller = {
	method: "POST",
	path: API.CONTEXT + API.ACCOUNTING_LEDGER_GROUP_FOR_DROP_DOWN_GET_LIST_PATH,
	options: {
		auth: {
			mode: "required",
			strategy: "jwt",
		},
		description: "Get ledger group list",
		plugins: { hapiAuthorization: false },
		validate: {
			options: {
				allowUnknown: false,
			},
			failAction: async (request, h, err) => {
				return h
					.response({ code: 301, status: false, message: err?.message }).takeover()
			},
		},
	},
	handler: async (request, h) => {
		log.debug(`Request received - ${JSON.stringify(request.query)}`)
		const response = await handle_request(request)
		log.debug(`Response sent - ${JSON.stringify(response)}`)
		return h.response(response)
	},
}

const handle_request = async (request) => {
	let data = await get_data(request)
	if (data.length == 0) {
		return { status: false, code: 201, message: "No data found" }
	}
	log.info(`Ledger group list data found`)
	return { status: true, code: 200, message: "Successfully Get ledger group list", data: data }
}

const get_data = async (request) => {
	let data = []
	let param = [request.auth.credentials.company_oid]
	let query = `select oid, ledger_group_name from ${TABLE.LEDGER_GROUP} 
            where company_oid = $1`
	let sql = {
		text: query,
		values: param,
	}
	try {
		data = await Dao.get_data(request.pg, sql)
	} catch (e) {
		log.error(`An exception occurred while getting ledger group list : ${e?.message}`)
	}
	return data
}

module.exports = route_controller
