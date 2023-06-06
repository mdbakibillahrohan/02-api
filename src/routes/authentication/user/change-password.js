"use strict"

const log = require("../../../util/log")
const Dao = require("../../../util/dao")
const Helper = require("../../../util/helper")
const Joi = require('joi');
const { API, TABLE } = require("../../../util/constant")

const payload_scheme = Joi.object({
    old_password: Joi.string().trim().min(1).max(32).required(),
    new_password: Joi.string().trim().min(1).max(32).required(),
});

const route_controller = {
    method: "POST",
    path: API.CONTEXT + API.AUTHENTICATION_USER_CHANGE_PASSWORD_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Change Password",
        plugins: {
            hapiAuthorization: {
                validateEntityAcl: true,
                validateAclMethod: 'isGranted',
                aclQuery: async (id, request) => {
                    return {
                        isGranted: async (user, role) => {
                            // return await Helper.is_granted(request, API.GET_USER_INFO)
                            return true;
                        }
                    }
                }
            }
        },
        validate: {
            payload: payload_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 301, status: false, message: err }).takeover();
            },
        },
    },
    handler: async (request, h) => {
        log.debug(`Request received - ${JSON.stringify(request.payload)}`)
        const response = await handle_request(request)
        log.debug(`Response sent - ${JSON.stringify(response)}`)
        return h.response(response)
    }
}

const handle_request = async (request) => {
    try {
        let data = await get_password (request)

        if (!data) {
            log.info(`User data not found`)
            return { status: true, code: 201, message: 'User data not found' }
        } else {
            if (data.password == request.payload.old_password) {
                await change_password(request, request.payload.new_password);
                log.info(`Change password for user - {${request.auth.credentials["loginid"]}}`);
                return {
                    status: true,
                    code: 200,
                    message: 'Successfully updated password'
                }
            } else {
                log.info(`Not match old password during change password for loginId - ${request.auth.credentials["loginid"]} `);
                return {
                    status: true,
                    code: 403,
                    message: `Old password doesn't match`
                }
            }
        }
    } catch (err) {
        log.error(`An exception occurred while updating: ${err}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }

}

const get_password = async (request) => {
    let data = null
    let sql = {
        text: `select password from ${ TABLE.LOGIN } 
             where 1 = 1 and loginId = $1`,
        values: [request.auth.credentials["loginid"]]
    }
    try {
        let data_set = await Dao.get_data(request.pg, sql)
        data = data_set.length > 0 ? data_set[0] : null
    } catch (e) {
        log.error(`An exception occurred while changing password: ${e}`)
    }
    return data
}

const change_password = async (request, new_password) => {
    let sql = {
        text: `update ${TABLE.LOGIN} set password = $1 
            where 1 = 1 and loginid = $2`,
        values: [new_password, request.auth.credentials["loginid"]]
    }
    try {
        await Dao.execute_value(request.pg, sql)
    } catch (e) {
        log.error(`An exception occurred while changing password: ${e}`)
    }
}


module.exports = route_controller
