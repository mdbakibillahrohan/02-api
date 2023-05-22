"use strict"

const log = require("../../../util/log")
const Dao = require("../../../util/dao")
const Helper = require("../../../util/helper")
const { API, TABLE } = require("../../../util/constant")
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
        return { status: true, code: 201, message: 'User data not found' }
    }
    log.info(`User data found`)
    return { status: true, code: 200, data: data }
}

const get_data = async (request) => {
    let userInfo = await autheticatedUserInfo(request)
    let list_data = [];

    let query = `select l.oid, l.loginId, r.roleId, l.name, l.status, l.mobileNo,
        l.address, l.email, l.menuJson, l.reportJson, l.referenceOid, l.referenceType,
        l.imagePath, l.companyOid, c.name as companyName, c.mnemonic as companyMnemonic, 
        c.packageOid, p.packageJson, p.name as packageName from ${ TABLE.LOGIN } as l
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
