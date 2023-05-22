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
        text: `SELECT oid, loginid, name, email, companyoid FROM ${TABLE.LOGIN} WHERE loginid = $1`,
        values: [loginId]
    }
    const userInfo = await Dao.get_data(request.pg, sql);
    return userInfo[0];
}


const passwordGenerator = (length, hasNumbers, hasSymbols) => {
    const alpha = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const integers = "0123456789";
    const exCharacters = "!@#$%^&*_-=+";
    let chars = alpha;
    if (hasNumbers) {
        chars += integers;
    }
    if (hasSymbols) {
        chars += exCharacters;
    }
    return generatePassword(length, chars);
}
const generatePassword = (length, chars) => {
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

module.exports = {
    is_granted: is_granted,
    autheticatedUserInfo: autheticatedUserInfo,
    passwordGenerator,
};
