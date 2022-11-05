"use strict";

const Dao = require("./dao")

const is_granted = async (request, api) => {
    let token = (request.headers.authorization).split(" ")[1]
    let access_api = await Dao.get_value(request.redis_db, token)
    access_api = JSON.parse(access_api)
    return access_api.includes(api)
}

module.exports = {
    is_granted: is_granted
};
