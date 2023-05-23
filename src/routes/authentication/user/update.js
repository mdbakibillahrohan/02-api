"use strict";

const Joi = require("@hapi/joi");
const uuid = require('uuid');
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const payload_scheme = Joi.object({

    oid: Joi.string().trim().min(1).max(128).required(),
    companyName: Joi.string().trim().min(1).max(128).required(),
    mnemonic: Joi.string().trim().min(1).max(32).required(),
    packageOid: Joi.string().trim().min(1).max(128).required(),
    name: Joi.string().trim().min(1).max(256).required(),
    mobileNo: Joi.string().trim().min(1).max(64).required(),
    email: Joi.string().email().trim().min(1).max(128).required(),
    imagePath: Joi.string().trim().min(1).max(256).required(),
    companyAddress: Joi.string().trim().min(1).max(128).required(),
    loginId: Joi.string().trim().min(1).max(128).required(),
    password: Joi.string().trim().min(1).max(128).required(),
});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.AUTHENTICATION_USER_SAVE_UPDATE_PATH,
    options: {
        auth: {
           mode: "required",
           strategy: "jwt"
        },
        description: "update login info",
        plugins: { hapiAuthorization: false },
        validate: {
            payload: payload_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 301, status: false, message: err?.message }).takeover();
            },
        },
    },
    handler: async (request, h) => {
        log.info(`Request received - ${JSON.stringify(request.payload)}`);
        const response = await handle_request(request);
        log.debug(`Response sent - ${JSON.stringify(response)}`);
        return h.response(response);
    },
};

const handle_request = async (request) => {
    try {
        let userInfo = await autheticatedUserInfo(request)

        if( !request.payload.oid ){
            
            const oid = uuid.v4();
            const peopleOid = uuid.v4();

            request.payload.peopleOid = peopleOid;

            request.payload.oid = oid;

            request.payload.referenceOid = request.payload.peopleOid;
            request.payload.referenceType = CONSTANT.REFERENCE_TYPE_EMPLOYEE;
            request.payload.peopleType = CONSTANT.PEOPLE_TYPE_USER;
            
            const today = new Date().toISOString().slice(0,10)
            const todayStr = new Date().toISOString().slice(0,10).replace(/-/g,"")
            
            const countPeople = await getCountPeople(userInfo, today)
            request.payload.peopleId = `${ request.payload.mnemonic }-U-${todayStr} ${countPeople}`;

            const check_LoginId = await checkLoginId(request);

            if(check_LoginId[0].loginid != request.payload["loginId"]) {
                const peopleQuery = await savePeople(userInfo, request)
                const userQuery = await saveLogin(userInfo, request)
                
                if( peopleQuery && userQuery){

                    log.info(`Successfully saved`);
                    return { status: true, code: 200, message: MESSAGE.SUCCESS_SAVE };            
                }else{
                    return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
                }

            } else{
                return { status: true, code: 409, message: MESSAGE.LOGIN_ID_ALLREADY_EXIST};
            
            }
        }
        else {
            
            const update = await updateLogin(userInfo, request)
            
            if(update["rowcount"] >= 1) {
                log.info(`Successfully update`);
                return { status: true, code: 200, message: MESSAGE.SUCCESS_UPDATE };  
            } else{
                log.info(`Already update`);
                return { status: true, code: 200, message: MESSAGE.ALREADY_UPDATE };  
            }
        }

    } catch (err) {
        log.error(`An exception occurred while update: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const saveLogin = async (userInfo, request) => {
    let cols = ["oid", "loginId", "password", "name", "imagePath",
    "menuJson", "reportJson", "status", "roleOid"];
    let params = ["$1", "$2", "$3", "$4", "$5", 
    `(select menuJson from ${ TABLE.ROLE }  where oid = $6), 
    (select reportJson from ${ TABLE.ROLE }  where oid = $7)`, 
    "$8", "$9"];
    let data = [uuid.v4(), request.payload['loginId'], request.payload["password"], request.payload["name"], request.payload["imagePath"], request.payload["roleOid"], request.payload["roleOid"], CONSTANT.ACTIVE, request.payload["roleOid"]];

    let idx = 10;
 
    if(request.payload["mobileNo"]){
        cols.push("mobileNo");
        params.push(`$${idx++}`);
        data.push(request.payload["mobileNo"]);
    } 
    if(request.payload["email"]){
        cols.push("email");
        params.push(`$${idx++}`);
        data.push(request.payload["email"]);
    }
    if(request.payload["address"]){
        cols.push("address");
        params.push(`$${idx++}`);
        data.push(request.payload["address"]);
    } 
    if(request.payload.companyOid){
        cols.push("companyOid");
        params.push(`$${idx++}`);
        data.push(request.payload.companyOid)
    }  
    if(request.payload["referenceOid"]){
        cols.push("referenceOid");
        params.push(`$${idx++}`);
        data.push(request.payload["referenceOid"]);
    }    
    if(request.payload["referenceType"]){
        cols.push("referenceType");
        params.push(`$${idx++}`);
        data.push(request.payload["referenceType"]);
    }
    if (request.payload['status'] == 'Submitted') {
        cols.push('submittedOn');
        params.push(`clock_timestamp()`)
    }
    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.LOGIN} (${scols}) values (${sparams})`;
    let sql = {
        text: query,
        values: data
    }
    
    try {
       return await Dao.execute_value(request.pg, sql) 
    }
    catch (err) {
        log.error(err?.message);

    }

};
const updateLogin = async (userInfo, request) => {
    const time =`${ new Date().toISOString().slice(0,10)} + ${ new Date().toISOString().slice(11,19) }`
    let cols = ["name = $1", "imagePath = $2", `menuJson = (select menuJson from ${ TABLE.ROLE } where oid = $3 )`, `reportJson = (select reportJson from ${ TABLE.ROLE } where oid = $4)`, "status = $5", "roleOid = $6", "editedBy = $7", "editedOn = $8"];

    let data = [request.payload["name"], request.payload["imagePath"], request.payload["roleOid"], request.payload["roleOid"], request.payload["roleOid"], CONSTANT.ACTIVE, request.payload["loginId"], time];

    let idx = 9;
 
    if(request.payload["mobileNo"]){
        cols.push(`mobileNo = $${idx++}`);
        data.push(request.payload["mobileNo"]);
    }

    if(request.payload["email"]){
        cols.push(`email = $${idx++}`);
        data.push(request.payload["email"]);
    }
    if(request.payload["address"]){
        cols.push(`address = $${idx++}`);
        data.push(request.payload["address"]);
    } 

    if (request.payload['status'] == 'Submitted') {
        cols.push('submittedOn');
        params.push(`clock_timestamp()`)
    }

    let sCols = cols.join(', ')
    let query = `update ${ TABLE.LOGIN } set ${sCols} where 1 = 1 and oid = $${idx++}`;

    data.push(request.payload["oid"])
    let sql = {
        text: query,
        values: data
    }
    
    try {
       return await Dao.execute_value(request.pg, sql) 
    }
    catch (err) {
        log.error(err?.message);

    }

};
const checkLoginId = async (request) => {
    try{

        let query = `select oid, loginId from ${ TABLE.LOGIN }  where 1 = 1 and loginId = $1`;
        let sql = {
            text: query,
            values: [request.payload["loginId"]]
        }
        return await Dao.get_data(request.pg, sql)
    } 
    catch (err) {
        log.error(`CheckLoginId error : ${err}`)
    }
    
}

const savePeople = async (userInfo,request) => {

    let cols = ["oid", "employeeId", "nameEn", "imagePath", "employeeType", "status", "companyOid"];
    let params = ["$1", "$2", "$3", "$4", "$5", "$6", "$7"];
    let data = [ request.payload["peopleOid"], request.payload["peopleId"], request.payload["name"], request.payload["imagePath"], request.payload["peopleType"], CONSTANT.ACTIVE, userInfo.companyOid ];

    let idx = 8;
    if(request.payload["companyOid"]){
        console.log('sp',request.payload.companyOid)
    }
    console.log(request.payload)
    if(request.payload["mobileNo"]){
        cols.push("mobileNo");
        params.push(`$${idx++}`);
        data.push(request.payload["mobileNo"]);
    }    
    if(request.payload["email"]){
        cols.push("email");
        params.push(`$${idx++}`);
        data.push(request.payload["email"]);
    }

    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.EMPLOYEE} (${scols}) values (${sparams})`;
    let sql = {
        text: query,
        values: data
    }
    
    try {
       return await Dao.execute_value(request.pg, sql) 
    }
    catch (err) {
        log.error("An Error in savePeople :",err?.message);

    }
}

const getCountPeople = async (userInfo, today) => {
    try{

        let query = `select count(*)+1 as count from ${ TABLE.EMPLOYEE } where 1 = 1 
            and CAST(createdon AS DATE) = to_date($1, 'yyyy-MM-dd') and companyOid = $2`;
        let sql = {
            text: query,
            values: [ today, userInfo["companyOid"]]
        }
        return await Dao.get_data(request.pg, sql)
    } 
    catch (err) {
        log.error(`CheckLoginId error : ${err}`)
    }
}
module.exports = save_controller;
