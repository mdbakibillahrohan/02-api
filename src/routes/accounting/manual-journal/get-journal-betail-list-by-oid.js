"use strict"

const Joi = require("@hapi/joi")
const log = require("../../../util/log")
const Dao = require("../../../util/dao")
const { API, TABLE } = require("../../../util/constant")

const payload_scheme = Joi.object({
	oid: Joi.string().trim().min(1).max(128).required(),
    offset: Joi.number().optional().allow(null, ""),
	limit: Joi.number().optional().allow(null, ""),
})

const route_controller = {
	method: "POST",
	path: API.CONTEXT + API.ACCOUNTING_JOURNAL_LIST_GET_BY_OID_PATH,
	options: {
		auth: {
			mode: "required",
			strategy: "jwt",
		},
		description: "get journal details list by oid",
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
    let count = await get_count(request)
	let data = await get_data(request)
	if (data == null) {
		log.warn(`Unable to get journal details list by oid - ${request.payload.oid}`)
		return { status: false, code: 201, message: "Not found journal details list", data: data }
	}
	log.info(`Get journal details list by oid - ${request.payload.oid}`)
	return { status: true, code: 200, message: "Successfully get journal details list", total: count, data: data }
}
const get_count = async (request) => {
	let index = 1
	let data, param = []
	let query = `select count(*)::int4 as total from ${TABLE.JOURNAL} 
		where 1 = 1 and journal_summary_oid = $${index++} and company_oid = $${index++}`
	param.push( request.payload.oid, request.auth.credentials.company_oid)

	let sql = {
		text: query,
		values: param,
	}
	try {
		let data_set = await Dao.get_data(request.pg, sql)
		data = data_set[0]["total"]
	} catch (e) {
		log.error(`An exception occurred while getting journal details list count : ${e?.message}`)
	}
	return data
}
const get_data = async (request) => {
	let data = null
	let sql = {
		text: `select js.oid, js.journal_date, js.journal_type, 
            j.description, js.amount, js.reference_no, js.status, 
            j.debited_amount, j.credited_amount, j.subledger_balance 
			from ${TABLE.JOURNAL_SUMMARY} js
            left join ${TABLE.JOURNAL} j on j.journal_summary_oid = js.oid 
            where js.oid = $1 and js.company_oid = $2`,
		values: [request.payload.oid, request.auth.credentials.company_oid],
	}
	try {
		let data_set = await Dao.get_data(request.pg, sql)
		data = data_set.length > 0 ? data_set : null
	} catch (e) {
		log.error(`An exception occurred while getting journal details list by oid : ${e?.message}`)
	}
	return data
}

module.exports = route_controller
