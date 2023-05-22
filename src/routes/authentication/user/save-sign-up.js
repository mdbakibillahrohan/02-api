"use strict";

const Joi = require("@hapi/joi");
const uuid = require('uuid');
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");

const payload_scheme = Joi.object({
    companyName: Joi.string().trim().min(1).max(128).required(),
    mnemonic: Joi.string().trim().min(1).max(32).required(),
    packageOid: Joi.string().trim().min(1).max(128).required(),
    name: Joi.string().trim().min(1).max(256).required(),
    mobileNo: Joi.string().trim().min(1).max(64).required(),
    email: Joi.string().trim().min(1).max(128).required(),
    imagePath: Joi.string().trim().min(1).max(256).required(),
    companyAddress: Joi.string().trim().min(1).max(128).required(),
    loginId: Joi.string().trim().min(1).max(128).required(),
    password: Joi.string().trim().min(1).max(128).required(),
});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.AUTHENTICATION_USER_SAVE_SIGNUP_PATH,
    options: {

        description: "save sign up",
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
        const companyOid = uuid.v4();
        const peopleOid = uuid.v4();
        const loginOid = uuid.v4();
        request.payload.companyOid = companyOid;

        request.payload.peopleOid = peopleOid;

        request.payload.loginOid = loginOid;

        request.payload.roleOid = CONSTANT.ADMIN
        request.payload.referenceOid = request.payload.peopleOid;
        request.payload.referenceType = CONSTANT.REFERENCE_TYPE_EMPLOYEE;
        request.payload.peopleType = CONSTANT.PEOPLE_TYPE_USER;
        request.payload.status = CONSTANT.ACTIVE
        
        const todayStr = new Date().toISOString().slice(0,10)
        request.payload.peopleId = `${ request.payload.mnemonic }-U-${todayStr} 01`;

        const check_LoginId = await checkLoginId(request);

        
        if(check_LoginId[0].loginid != request.payload.loginId) {
            const companyQuery = await saveCompany(request);
            const peopleQuery = await savePeople(request);
            const userQuery = await saveLogin(request);
            
            if(companyQuery && peopleQuery && userQuery){

                log.info(`Successfully saved`);
                return { status: true, code: 200, message: MESSAGE.SUCCESS_SAVE };            
            }else{
                return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
            }

        } else{
            return { status: true, code: 409, message: MESSAGE.LOGIN_ID_ALLREADY_EXIST};

           
        }


    } catch (err) {
        log.error(`An exception occurred while saving: ${err?.message}`);
        return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR };
    }
};

const saveLogin = async (request) => {
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
const saveCompany = async  (request) => {

    let cols = ["oid", "name", "mnemonic", "address", "packageOid"];
    let params = ["$1", "$2", "$3", "$4", "$5"];
    let data = [request.payload.companyOid, request.payload['name'], request.payload["mnemonic"], request.payload["companyAddress"], request.payload.packageOid];
    let idx = 6;
 
    let scols = cols.join(', ')
    let sparams = params.join(', ')
    let query = `insert into ${TABLE.COMPANY} (${scols}) values (${sparams})`;
    let sql = {
        text: query,
        values: data
    }
    try {

        return await Dao.execute_value(request.pg, sql)
    }
    catch (err){
        log.error(`savaCompany Funtion error: ${err?.message}`)
    }
} 

const savePeople = async (request) => {

    let cols = ["oid", "employeeId", "nameEn", "imagePath", "employeeType", "status", "companyOid"];
    let params = ["$1", "$2", "$3", "$4", "$5", "$6", "$7"];
    let data = [ request.payload["peopleOid"], request.payload["peopleId"], request.payload["name"], request.payload["imagePath"], request.payload["peopleType"], CONSTANT.ACTIVE, request.payload.companyOid ];

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

module.exports = save_controller;