"use strict";

const Joi = require("@hapi/joi");
const uuid = require('uuid');
const log = require("../../util/log");
const Dao = require("../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../util/constant");

const payload_scheme = Joi.object({
    // companyName: Joi.string().trim().min(1).max(256).required(),
    // mnemonic: Joi.string().trim().min(1).max(256).required(),
    // packageOid: Joi.string().trim().min().max(128).required(),
    // name: Joi.string().trim().min(1).max(256).required(),
    // mobileNo: Joi.string().trim().min(1).max(64).required(),
    // email: Joi.string().trim().min(1).max(354).required(),
    // imagePath: Joi.string().trim().min(1).max(256).required(),
    // companyAddress: Joi.string().trim().min(1).max(128).required(),
    // loginId: Joi.string().trim().min(1).max(128).required(),
    // password: Joi.string().trim().min(1).max(128).required(),
    password: Joi.string().trim().min(1).max(128).optional(),
});

const save_controller = {
    method: "POST",
    path: API.CONTEXT + API.AUTHENTICATION_SAVE_SIGNUP_PATH,
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
        request.payload.companyOid = uuid.v4()
        request.payload.peopleOid = uuid.v4()
        request.payload.loginOid = uuid.v4()
        request.payload.roleOid = CONSTANT.ADMIN
        request.payload.referenceOid = peopleOid;
        request.payload.referenceType = CONSTANT.REFERENCE_TYPE_EMPLOYEE;
        request.payload.peopleType = CONSTANT.PEOPLE_TYPE_USER;
        request.payload.status = CONSTANT.ACTIVE
        
        const todayStr = new Date().toLocaleDateString() 

        log.info(`Successfully saved`);
        return { status: true, code: 200, message: MESSAGE.SUCCESS_SAVE };
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
    let data = [uuid.v4(), request.payload['loginId'], request.payload["password"], request.payload["name"], request.payload["menuJson"], request.payload["reportJson"], CONSTANT.ACTIVE, request.payload["roleOid"]];

    let idx = 10;
 
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

        let query = `select oid, loginId from "${ TABLE.LOGIN }  where 1 = 1 and loginId = $1`;
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
    const oid = uuid.v4();

    let cols = ["oid", "name", "mnemonic", "address", "packageOid"];
    let params = ["$1", "$2", "$3", "$4", "$5"];
    let data = [request.payload["companyOid"], request.payload['name'], request.payload["mnemonic"], request.payload["companyAddress"], request.payload["packageOid"]];
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
    const oid = uuid.v4();

    let cols = ["oid", "employeeId", "nameEn", "imagePath", "employeeType", "status", "companyOid"];
    let params = ["$1", "$2", "$3", "$4", "$5", "$6", "$7"];
    let data = [ request.payload["peopleOid"], request.payload["peopleId"], request.payload["name"], request.payload["imagePath"], request.payload["peopleType"], CONSTANT.ACTIVE, request.payload["companyOid"] ];

    let idx = 8;
 
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
