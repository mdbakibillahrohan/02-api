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
	log.info(`[${request.auth.credentials.company_oid}/${request.auth.credentials.login_id}] - ${count} chart of account found`)
	return { status: true, code: 200, message: `Successfully get chart of account list`, total: count, data: data }
}

const get_count = async (request) => {
	let index = 1
	let data, param = []
	let query = `select count(*)::int4 as total from ${TABLE.LEDGER} 
		where 1 = 1 and company_oid = $${index++}`
	param.push(request.auth.credentials.company_oid)

	if (request.payload.search_text && request.payload.search_text.length > 0) {
		query += ` and (lower(ls.ledger_subgroup_name) ilike $${index}) or
            (lower(ls.ledger_subgroup_name) ilike $${index})
            or (lower(ledger_subgroup_code) ilike $${index++}) `
		param.push(`%${request.payload.search_text}%`)
	}
	let sql = {
		text: query,
		values: param,
	}
	try {
		let data_set = await Dao.get_data(request.pg, sql)
		data = data_set[0]["total"]
	} catch (e) {
		log.error(`An exception occurred while getting chart of account list count : ${e?.message}`)
	}
	return data
}

const get_data = async (request) => {
	let index = 1
	let data, param = [] 
	let query = `select ls.oid, ls.ledger_subgroup_code, ls.ledger_subgroup_name, 
        ls.ledger_subgroup_type,  ls.balance_sheet_item, lg.ledger_group_name
		from ${TABLE.LEDGER_SUBGROUP} ls 
        left join ${TABLE.LEDGER_GROUP} lg on lg.oid = ls.ledger_group_oid
        where 1 = 1 and ls.company_oid = $${index++}`
	param.push(request.auth.credentials.company_oid)

	if (request.query.ledger_group_oid) {
		query += ` and ls.ledger_group_oid = $${index++}`
		param.push(request.query.ledger_group_oid)
	}
	if (request.payload.search_text && request.payload.search_text.length > 0) {
		query += ` and (lower(ls.ledger_subgroup_name) ilike $${index}) or
            (lower(ls.ledger_subgroup_name) ilike $${index})
            or (lower(ledger_subgroup_code) ilike $${index++}) `
		param.push(`%${request.payload.search_text}%`)
	}
	query += ` order by lg.ledger_group_code, ls.ledger_subgroup_code`
	if(request.payload.offset) {
		query += ` offset $${index++}`
		param.push(request.payload.offset)
	}
	if (request.payload.limit) {
		query += ` limit $${index++}`
		param.push(request.payload.limit)
	}
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
