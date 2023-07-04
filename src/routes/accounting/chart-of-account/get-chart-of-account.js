"use strict"

const Joi = require("@hapi/joi")
const Dao = require("../../../util/dao")
const log = require("../../../util/log")
const { API, TABLE } = require("../../../util/constant")

const route_controller = {
	method: "POST",
	path: API.CONTEXT + API.ACCOUNTING_CHART_OF_ACCOUNT_GET_LIST_PATH,
	options: {
		auth: {
			mode: "required",
			strategy: "jwt",
		},
		description: "Get chart of account",
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
	log.info(`Chart of account data found`)
	return { status: true, code: 200, message: "Successfully get chart of account", data: data }
}

const get_data = async (request) => {
	let data = []
	let param = [request.auth.credentials.company_oid]
	let query = `select json_build_object('ledger_group_name', lg.ledger_group_name, 'children', 
		(select json_agg(json_build_object('ledger_subgroup_name', lsg.ledger_subgroup_name, 'children', 
		(select json_agg(json_build_object('ledger_name', l.ledger_name, 'oid', l.oid, 'ledger_code',l.ledger_code,'ledger_balance', l.ledger_balance)) 
		from ${TABLE.LEDGER} l where l.ledger_subgroup_oid = lsg.oid)
		)) from ${TABLE.LEDGER_SUBGROUP} lsg where lsg.ledger_group_oid = lg.oid)
		)  as data
		from ${TABLE.LEDGER_GROUP} lg
		where company_oid = $1`
	let sql = {
		text: query,
		values: param,
	}
	try {
		data = await Dao.get_data(request.pg, sql)
	} catch (e) {
		log.error(`An exception occurred while getting chart of account data : ${e?.message}`)
	}
	return data
}

module.exports = route_controller
