'use strict'

const uuid = require('uuid')
const _ = require('underscore')
const Joi = require('@hapi/joi')
const Dao = require('../../../util/dao')
const log = require('../../../util/log')
const { API, TABLE } = require('../../../util/constant')

const payload_scheme = Joi.object({
	oid: Joi.string().trim().min(1).max(128).required(),
	passenger_id: Joi.string().trim().min(1).max(32).allow(null, '').optional(),
	full_name: Joi.string().trim().min(1).max(128).allow(null, '').required(),
	sur_name: Joi.string().trim().min(1).max(128).allow(null, '').required(),
	given_name: Joi.string().trim().min(1).max(128).allow(null, '').required(),
	gender: Joi.string().trim().valid('Male', 'Female', 'Others').allow(null, '').min(1).max(16).required(),

	mobile_no: Joi.string().trim().min(1).max(128).allow(null, '').optional(),
	email: Joi.string().trim().min(1).max(128).allow(null, '').optional(),
    nationality: Joi.string().trim().min(1).max(128).allow(null, '').required(),
	country_code: Joi.string().trim().min(1).max(32).allow(null, '').optional(),
	birth_registration_no: Joi.string().trim().min(1).max(32).allow(null, '').optional(),
	personal_no: Joi.string().trim().min(1).max(32).allow(null, '').optional(),

	passport_number: Joi.string().trim().min(1).max(32).allow(null, '').required(),
	previous_passport_number: Joi.string().trim().min(1).max(32).allow(null, '').optional(),
	birth_date: Joi.date().allow(null, '').optional(),
    passport_issue_date: Joi.date().allow(null, '').optional(),
	passport_expiry_date: Joi.date().allow(null, '').optional(),
    passport_image_path: Joi.string().trim().optional().allow(null, ''),
	issuing_authority: Joi.string().trim().min(1).max(128).allow(null, '').optional(),
	description: Joi.string().trim().min(1).allow(null, '').optional(),
	passport_json: Joi.array().items(Joi.string().trim().optional().allow(null, '')).optional(),
    status: Joi.string().trim().valid('Active', 'Inactive').max(32).allow(null, '').required(),
	country_oid: Joi.string().trim().min(1).max(128).allow(null, '').optional(),
    people_oid: Joi.string().trim().min(1).max(128).allow(null, '').required(),

    passport_detail_list: Joi.array().items(Joi.object({
        oid: Joi.string().trim().min(1).max(128).required(),
        title: Joi.string().trim().min(1).max(128).allow(null, '').required(),
        image_path: Joi.string().trim().min(1).max(256).allow(null, '').required(),
        remarks: Joi.string().trim().allow(null, '').optional(),
    })).optional(),
    passport_command_list: Joi.array().items(Joi.object({
        oid: Joi.string().trim().min(1).max(128).required(),
        title: Joi.string().trim().min(1).max(128).allow(null, '').required(),
        command: Joi.string().trim().min(1).allow(null, '').required(),
        remarks: Joi.string().trim().allow(null, '').optional(),
    })).optional(),
    passenger_notification_list: Joi.array().items(Joi.object({
        oid: Joi.string().trim().min(1).max(128).required(),
        name: Joi.string().trim().min(1).max(128).allow(null, '').required(),
        notification_value: Joi.string().trim().allow(null, '').required(),
        subscribe: Joi.string().trim().allow(null, '').required(),
        remarks: Joi.string().trim().allow(null, '').optional(),
    })).optional(),
    passport_visa_list: Joi.array().items(Joi.object({
        oid: Joi.string().trim().min(1).max(128).required(),
        visa_number: Joi.string().trim().min(1).max(128).allow(null, '').required(),
        visa_type: Joi.string().trim().min(1).max(128).allow(null,'').optional(),
        visa_issue_date: Joi.date().allow(null, '').optional(),
        visa_expiry_date: Joi.date().allow(null, '').optional(),
        country: Joi.string().trim().min(1).max(128).allow(null, '').optional(),
        image_path: Joi.string().trim().min(1).max(256).allow(null, '').optional(),
        remarks: Joi.string().trim().allow(null, '').optional(),
        status: Joi.string().trim().valid('Active', 'Inactive').allow(null, '').required(),

    })).optional(),

})
const route_controller = {
	method: 'POST',
	path: API.CONTEXT + API.MASTER_PASSPORT_UPDATE_PATH,
	options: {
		auth: {
			mode: 'required',
			strategy: 'jwt',
		},
		description: 'Update passport',
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
	try {
		const res_data = await post_data(request)
        if (res_data.status) {
            	log.info(`[${request.auth.credentials.company_oid}/${request.auth.credentials.login_id}] - passport update - ${request.payload.name}`)
            return { status: true, code: 200, message: `Successfully update ${request.payload.full_name}` }
        }
        return { status: false, code: 409, message: res_data.message }
    } catch (err) {
        log.error(`An exception occurred while updating passport info: ${err}`)
        return { status: false, code: 500, message: `Server internal error` }
    }
}

const post_data = async (request) => {
      try {
        const user_info = {
			company_oid: request.auth.credentials.company_oid,
			login_id: request.auth.credentials.login_id
		}

        const count = await get_count(request)
        if (count <= 0) {
            return {
                message: 'No data found',
                status: false
            }
        }
        const passport_oid = request.payload.oid
        const res_save_passport = await save_passport(request, passport_oid)
        if (!res_save_passport) {
            return {
                status: false,
                message: 'Problem in update passport'
            }
        }
        if(request.payload.passport_detail_list){
            request.payload.passport_detail_list.forEach(async (element, index) => {
                const res_save_passport_detail = await save_passport_Detail(request, user_info, element, index, passport_oid)
                if (!res_save_passport_detail) {
                    return false
                }
            })
        }
        if(request.payload.passport_command_list) {
            request.payload.passport_command_list.forEach(async (element, index) => {
                const res_save_passport_command = await save_passport_command(request, user_info, element, index, passport_oid)
                if (!res_save_passport_command) {
                    return false
                }
            }) 
        }
        if(request.payload.passenger_notification_list) {
            request.payload.passenger_notification_list.forEach(async (element, index) => {
                const res_save_passport_notification = await save_passenger_notification(request, user_info, element, index, passport_oid)
                if (!res_save_passport_notification) {
                    return false
                }
            })
        }

        if(request.payload.passport_visa_list){
            request.payload.passport_visa_list.forEach(async (element, index) => {
                const res_save_passport_visa = await save_passport_visa_information(request, user_info, element, index, passport_oid)
                if (!res_save_passport_visa) {
                    return false
                }
            })            
        }

        return {
            status: true
        }
    } catch (error) {
        throw error
    }
}


const save_passport = async (request, user_info, passport_oid) => {
    let executed
    let index = 1
    let cols = [`full_name = $${index++}`, `sur_name = $${index++}`, `given_name = $${index++}`, `gender = $${index++}`, `nationality = $${index++}`, `passport_number = $${index++}`, `people_oid = $${index++}`,`edited_on = $${index++}`, `edited_by = $${index++}` ]

    let data = [request.payload.full_name, request.payload.sur_name, request.payload.given_name, request.payload.gender, request.payload.nationality, request.payload.passport_number, request.payload.people_oid, 'now()', user_info.login_id]

    if (request.payload.birth_date) {
        cols.push(`birth_date = $${index++}`)
        data.push(new Date(request.payload.birth_date).toISOString().slice(0, 10))
    }
    if (request.payload.birth_registration_no) {
        cols.push(`birth_registration_no = $${index++}`)
        data.push(request.payload.birth_registration_no)
    }
    if (request.payload.passenger_id) {
        cols.push(`passenger_id = $${index++}`)
        data.push(request.payload.passenger_id)
    }
    if (request.payload.passport_json) {
        cols.push(`passport_json = $${index++}`)
        data.push(`${request.payload.passport_json}`)
    }
    if (request.payload.passport_issue_date) {
        cols.push(`passport_issue_date = $${index++}`)
        data.push(new Date(request.payload.passport_issue_date).toISOString().slice(0, 10))
    }
    if (request.payload.passport_expiry_date) {
        cols.push(`passport_expiry_date = $${index++}`)
        data.push(new Date(request.payload.passport_expiry_date).toISOString().slice(0, 10))
    }
    if (request.payload.status) {
        cols.push(`status = $${index++}`)
        data.push(request.payload.status)
    }
    if (request.payload.country_code) {
        cols.push(`country_code = $${index++}`)
        data.push(request.payload.country_code)
    }
    if (request.payload.country_oid) {
        cols.push(`country_oid = $${index++}`)
        data.push(request.payload.country_oid)
    }
    if (request.payload.mobile_no) {
        cols.push(`mobile_no = $${index++}`)
        data.push(request.payload.mobile_no)
    }
    if (request.payload.email) {
        cols.push(`email = $${index++}`)
        data.push(request.payload.email)
    }
    if (request.payload.personal_no) {
        cols.push(`personal_no = $${index++}`)
        data.push(request.payload.personal_no)
    }
    if (request.payload.previous_passport_number) {
        cols.push(`previous_passport_number = $${index++}`)
        data.push(request.payload.previous_passport_number)
    }
    if (request.payload.passport_image_path) {
        cols.push(`passport_image_path = $${index++}`)
        data.push(request.payload.passport_image_path)
    }
    if (request.payload.issuing_authority) {
        cols.push(`issuing_authority = $${index++}`)
        data.push(request.payload.issuing_authority)
    }
    if (request.payload.description) {
        cols.push(`description = $${index++}`)
        data.push(request.payload.description)
    }

    let scols = cols.join(', ')
    let query = `update ${TABLE.PASSPORT} set ${scols} where 1 = 1 and oid = ${index++} and company_oid = ${index++}`
    data.push(passport_oid)
    data.push(user_info.company_oid)
    let sql = {
        text: query,
        values: data
    }
    try {
        executed = await Dao.execute_value(request.pg, sql)
    } catch (e) {
        throw new Error(e)
    }
    if (executed.rowCount > 0) {
        return true
    }
    return false
}

const save_passport_Detail = async (request, user_info, passport_detail, sort_order_no, passport_oid) => {
    let executed
    let index = 1
    let cols = [`title = $${index++}`, `image_path = $${index++}`, `sort_order = $${index++}`]

    let data = [ passport_detail.title, passport_detail.image_path, sort_order_no]

    if (request.payload.country_oid) {
        cols.push(`country_oid = $${index++}`)
        data.push(request.payload.country_oid)
    }    
    if (passport_detail.remarks) {
        cols.push(`remarks = $${index++}`)
        data.push(passport_detail.remarks)
    }

    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `update ${TABLE.PASSPORT_DETAIL} set ${scols} where 1 = 1 and oid = $${index++} and passport_oid = $${index++} and company_oid = $${index++}`
    data.push(passport_detail.oid)
    data.push(passport_oid)
    data.push(user_info.company_oid)
    let sql = {
        text: query,
        values: data
    }
    try {
        executed = await Dao.execute_value(request.pg, sql)
    } catch (e) {
        throw new Error(e)
    }
    if (executed.rowCount > 0) {
        return true
    }
    return false
}

const save_passport_command = async (request, user_info, passport_command, sort_order_no, passport_oid) => {

    let executed
    let index = 1
    let cols = [`oid`, `title`, `command`, `sort_order`, `passport_oid`, `company_oid`]
    let params = [`$${index++}`, `$${index++}`, `$${index++}`, `$${index++}`, `$${index++}`, `$${index++}`]

    let data = [uuid.v4(), passport_command.title, passport_command.command, sort_order_no, passport_oid, user_info.company_oid]

    if (passport_command.remarks) {
        cols.push(`remarks`)
        params.push(`$${index++}`)
        data.push(passport_command.remarks)
    }

    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.PASSPORT_COMMAND} (${scols}) values (${sparams})`
    let sql = {
        text: query,
        values: data
    }
    try {
        executed = await Dao.execute_value(request.pg, sql)
    } catch (e) {
        throw new Error(e)
    }
    if (executed.rowCount > 0) {
        return true
    }
    return false
}

const save_passenger_notification = async (request, user_info, passenger_notification, sort_order_no, passport_oid) => {
    let executed
    let index = 1
    let cols = [`oid`, `name`, `notification_value`, `subscribe`, `sort_order`,
        `passport_oid`, `company_oid`]
    let params = [`$${index++}`, `$${index++}`, `$${index++}`, `$${index++}`, `$${index++}`, `$${index++}`, `$${index++}`]
    const oid = uuid.v4()
    let data = [oid, passenger_notification.name, passenger_notification.notification_value, passenger_notification.subscribe, sort_order_no, passport_oid, user_info.company_oid]

    if (passenger_notification.remarks) {
        cols.push(`remarks`)
        params.push(`$${index++}`)
        data.push(passenger_notification.remarks)
    }

    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.PASSENGER_NOTIFICATION} (${scols}) values (${sparams})`
    let sql = {
        text: query,
        values: data
    }
    try {
        executed = await Dao.execute_value(request.pg, sql)
    } catch (e) {
        throw new Error(e)
    }
    if (executed.rowCount > 0) {
        return true
    }
    return false
}

const save_passport_visa_information = async (request, passport_visa, sort_order_no, passport_oid) => {

    let executed
    let index = 1
    let cols = [`oid`, `visa_number`, `sort_order`, `passport_oid`, `company_oid`]
    let params = [`$${index++}`, `$${index++}`, `$${index++}`, `$${index++}`, `$${index++}`]
    const oid = uuid.v4()
    let data = [oid, passport_visa.visa_number, sort_order_no, passport_oid, request.auth.credentials.company_oid]

    if (passport_visa.visa_type) {
        cols.push(`visa_type`)
        params.push(`$${index++}`)
        data.push(passport_visa.visa_type)
    }
    if (passport_visa.visa_issue_date) {
        cols.push(`visa_issue_date`)
        params.push(`$${index++}`)
        data.push(passport_visa.visa_issue_date)
    }
    if (passport_visa.visa_expiry_date) {
        cols.push(`visaExpiryDate`)
        params.push(`$${index++}`)
        data.push(passport_visa.visa_expiry_date)
    }
    if (passport_visa.country) {
        cols.push(`country`)
        params.push(`$${index++}`)
        data.push(passport_visa.country)
    }
    if (passport_visa.image_path) {
        cols.push(`image_path`)
        params.push(`$${index++}`)
        data.push(passport_visa.image_path)
    }
    if (passport_visa.remarks) {
        cols.push(`remarks`)
        params.push(`$${index++}`)
        data.push(passport_visa.remarks)
    }
    if (passport_visa.status) {
        cols.push(`status`)
        params.push(`$${index++}`)
        data.push(passport_visa.status)
    }

    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.PASSPORT_VISA_INFORMATION} (${scols}) values (${sparams})`
    let sql = {
        text: query,
        values: data
    }
    try {
        executed = await Dao.execute_value(request.pg, sql)
    } catch (e) {
        throw new Error(e)
    }
    if (executed.rowCount > 0) {
        return true
    }
    return false
}

const get_count = async (request) => {
    let count = 0
    let data = [request.payload.oid, request.payload.people_oid, request.auth.credentials.company_oid]

    let query = `select count(*) as total from ${TABLE.PASSPORT}  where 1 = 1 and oid = $1 and people_oid = $2 and company_oid = $3`

    let sql = {
        text: query,
        values: data
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql)
        count = data_set[0]['total']
        log.info(`Found: ${count}`)
    } catch (err) {
        log.error(err)
        throw new Error(err)
    }
    return count
}

module.exports = route_controller