"use strict"

const log = require("../../../util/log")
const Dao = require("../../../util/dao")
const Helper = require("../../../util/helper")
const { API, TABLE , MESSAGE} = require("../../../util/constant")
const { autheticatedUserInfo } = require("../../../util/helper");

const route_controller = {
    method: "GET",
    path: API.CONTEXT + API.AUTHENTICATION_USER_GET_USER_INFO,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "User info",
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
         }
    },
    handler: async (request, h) => {
        log.debug(`Request received - ${JSON.stringify(request.payload)}`)
        const response = await handle_request(request)
        log.debug(`Response sent - ${JSON.stringify(response)}`)
        return h.response(response)
    }
}

const handle_request = async (request) => {
    let data = await get_data(request)
    if (!data) {
        log.info(`User data not found`)
        return { status: true, code: 201, message:  MESSAGE.NO_DATA_FOUND}
    }
    log.info(`User data found`)
    return { status: true, code: 200, data: data }
}

const get_data = async (request) => {
    let userInfo = await autheticatedUserInfo(request)
    let list_data = [];

    let query = `select l.oid, l.loginId as "login_id", r.roleId as "role_id", l.name, l.status, 
        l.mobileNo as "mobile_no", l.address, l.email, l.menuJson as "menu_json", l.reportJson as "report_json", l.referenceOid as "reference_oid", l.referenceType as "reference_type",
        l.imagePath as "image_path", l.companyOid as "company_oid", c.name as company_name, c.mnemonic as company_mnemonic, c.packageOid as "package_oid", p.packageJson as "package_json", p.name as package_name from ${ TABLE.LOGIN } as l
        left join ${ TABLE.ROLE } as r on l.roleoid = r.oid left join 
        ${ TABLE.COMPANY } as c on l.companyoid = c.oid  left join ${ TABLE.PACKAGE } as p 
        on c.packageoid = p.oid where 1 = 1 and l.loginId = $1`;

    let sql = {
        text: query,
        values: [userInfo.loginid]
    }
    try {
        list_data = await Dao.get_data(request.pg, sql);
    } catch (e) {
        throw new Error(e);
    }
    return list_data;
}


module.exports = route_controller
