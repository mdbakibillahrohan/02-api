"use strict";

const { TABLE } = require("./constant");
const Dao = require("./dao")

const is_granted = async (request, api) => {
    let token = (request.headers.authorization).split(" ")[1]
    let access_api = await Dao.get_value(request.redis_db, token)
    access_api = JSON.parse(access_api)
    return access_api.includes(api)
}

const autheticatedUserInfo = async (request) => {
    const loginId = request.auth.credentials['loginid'];
    const sql = {
        text: `SELECT oid, name, email, companyoid FROM ${TABLE.LOGIN} WHERE loginid = $1`,
        values: [loginId]
    }
    const userInfo = await Dao.get_data(request.pg, sql);
    return userInfo[0];
}

module.exports = {
    is_granted: is_granted,
    autheticatedUserInfo: autheticatedUserInfo
};
