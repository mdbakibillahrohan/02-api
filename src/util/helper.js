"use strict";

const moment = require("moment");
const uuid = require("uuid");
const JWT = require("jsonwebtoken");
const Dao = require("./dao");
const { ALGORITHM, BEARER, SCHEMA, TABLE } = require("./constant");

const generate_token = (token) => {
    const access_token = get_access_token(token);

    const response = {
        access_token: access_token,
        token_type: BEARER,
        access_token_expire_in: process.env.ACCESS_TOKEN_SECRET_EXPIRE,
    };

    return response;
};

const get_access_token = (token) => {
    token["time"] = moment.valueOf() + uuid.v4();
    return JWT.sign(token, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_SECRET_EXPIRE,
        algorithm: ALGORITHM,
    });
};

const get_access_token_from_db = async (request) => {
    let data = null;
    let access_token = request.headers["authorization"].replace("Bearer ", "").trim();
    let sql = {
        text: `select status, to_char(sign_out_time, 'YYYY-MM-DD HH24:MI:SS.MS') as sign_out_time
            from ${SCHEMA.PUBLIC}.${TABLE.LOGIN_LOG} 
            where 1 = 1 and access_token = $1`,
        values: [access_token],
    };
    try {
        let data_set = await Dao.get_data(request.pg, sql);
        data = data_set[0];
    } catch (e) {
        log.error(`An exception occurred while getting login log : ${e?.message}`);
    }
    return data;
};

const number_to_english_word = (num) => {
    let number = parseInt(num);
    var NS = [
        { value: 10000000, str: "Crore" },
        { value: 100000, str: "Lakh" },
        { value: 1000, str: "Thousand" },
        { value: 100, str: "Hundred" },
        { value: 90, str: "Ninety" },
        { value: 80, str: "Eighty" },
        { value: 70, str: "Seventy" },
        { value: 60, str: "Sixty" },
        { value: 50, str: "Fifty" },
        { value: 40, str: "Forty" },
        { value: 30, str: "Thirty" },
        { value: 20, str: "Twenty" },
        { value: 19, str: "Nineteen" },
        { value: 18, str: "Eighteen" },
        { value: 17, str: "Seventeen" },
        { value: 16, str: "Sixteen" },
        { value: 15, str: "Fifteen" },
        { value: 14, str: "Fourteen" },
        { value: 13, str: "Thirteen" },
        { value: 12, str: "Twelve" },
        { value: 11, str: "Eleven" },
        { value: 10, str: "Ten" },
        { value: 9, str: "Nine" },
        { value: 8, str: "Eight" },
        { value: 7, str: "Seven" },
        { value: 6, str: "Six" },
        { value: 5, str: "Five" },
        { value: 4, str: "Four" },
        { value: 3, str: "Three" },
        { value: 2, str: "Two" },
        { value: 1, str: "One" }
    ];
    var result = '';
    for (var n of NS) {
        if (number >= n.value) {
            if (number <= 99) {
                result += n.str;
                number -= n.value;
                if (number > 0) result += ' ';
            } else {
                var t = Math.floor(number / n.value);
                var d = number % n.value;
                if (d > 0) {
                    return number_to_english_word(t) + ' ' + n.str + ' ' + number_to_english_word(d);
                } else {
                    return number_to_english_word(t) + ' ' + n.str;
                }
            }
        }
    }
    return result;
}

module.exports = {
    generate_token: generate_token,
    get_access_token: get_access_token,
    get_access_token_from_db: get_access_token_from_db,
    number_to_english_word: number_to_english_word
};
