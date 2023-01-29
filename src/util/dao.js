 "use strict";

const ms = require("ms");
const log = require("./log");
const get_data = async (pool, query) => {
    // const client = await pool.connect();
    const client = await pool;
    try {
        const res = await client.query(query);
        return res.rows;
    } catch (e) {
        log.error("Unable to execute statement in database: ", e);
        throw e;
    } finally {
        // client.release();
    }
};

const execute_value = async (pool, query) => {
    const client = await pool;
    try {
        await client.query("BEGIN");
        const executedQuery = await client.query(query);
        await client.query("COMMIT");
        console.log(executedQuery);
        return executedQuery;
    } catch (e) {
        await client.query("ROLLBACK");
        log.error("Unable to execute statement in database: ", e);
        throw e;
    } finally {
        // client.release();
    }
};

const execute_values = async (pool, query) => {
    const client = await pool;
    try {
        await client.query("BEGIN");
        for (let q of query) await client.query(q);
        await client.query("COMMIT");
    } catch (e) {
        await client.query("ROLLBACK");
        log.error("Unable to execute statement in database: ", e);
        throw e;
    } finally {
        // client.release();
    }
};

const set_value = async (redis_client, key, value, expire_in) => {
    try {
        await redis_client.setAsync(key, value);
        if (expire_in) await redis_client.expireAsync(key, ms(expire_in) / 1000)
    } catch (e) {
        log.error("Unable to set statement in redis: ", e);
        throw e;
    }
};
const get_value = async (redis_client, key) => {
    try {
        return await redis_client.getAsync(key);
    } catch (e) {
        log.error("Unable to get statement in redis: ", e);
        throw e;
    }
};

const del_value = async (redis_client, key) => {
    try {
        return await redis_client.delAsync(key);
    } catch (e) {
        log.error("Unable to get statement in redis: ", e);
        throw e;
    }
};

module.exports = {
    get_data: get_data,
    execute_value: execute_value,
    execute_values: execute_values,
    set_value: set_value,
    get_value: get_value,
    del_value: del_value
};
