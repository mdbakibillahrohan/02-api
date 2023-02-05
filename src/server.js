"use strict";

const { Client } = require("pg")
const Path = require("path")
var moment = require("moment")
const log = require("./util/log");
const Dao = require("./util/dao")
const Hapi = require("@hapi/hapi")
const Redis = require("redis")
let Bluebird = require("bluebird")
Bluebird.promisifyAll(Redis.RedisClient.prototype)
Bluebird.promisifyAll(Redis.Multi.prototype)
const { TEXT } = require("./util/constant")
require("dotenv").config({ path: `./src/env/.env.${process.env.NODE_ENV}` })

let server, pool, redis_db;

const init_db = () => {
    const pool = new Client({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        max: 20, // set pool max size to 20
        idleTimeoutMillis: 30000, // close idle clients after 30 second
        connectionTimeoutMillis: 2000, // return an error after 2 second if connection could not be established
        maxUses: 7500, // close (and replace) a connection after it has been used 7500 times (see below for discussion)
    })
    return pool;
};

const init_redis = (db) => {
    const redis_client = Redis.createClient({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        db: db,
        password: process.env.REDIS_PASSWORD,
    })
    return redis_client;
};

const start_server = async () => {

    server = Hapi.server({
        port: process.env.APP_PORT || 3000,
        host: process.env.APP_HOST || "localhost",
        routes: {
            cors: {
                origin: ["*"],
            },
        },
    })

    await server.register(require("hapi-auth-jwt2"))
    await server.auth.strategy("jwt", "jwt", {
        complete: true,
        tokenType: TEXT.BEARER,
        key: process.env.ACCESS_TOKEN_SECRET,
        verifyOptions: {
            ignoreExpiration: false,
            algorithms: [TEXT.ALGORITHM]
        },
        validate: async (decoded, request, h) => {
            let access_token = (request.headers.authorization).split(" ")[1];
            let r_token = await Dao.get_value(request.redis_db, access_token)
            if (r_token == null) {
                log.warn(`Invalid token - ${access_token}`)
                return { isValid: false, credentials: decoded };
            }
            return { isValid: true, credentials: decoded };
        },
    })

    await server.register({
        plugin: require("hapi-auto-route"),
        options: {
            routes_dir: Path.join(__dirname, "routes")
        },
    })

    await server.register({
        plugin: require("hapi-authorization"),
        options: {
            roles: false,
        },
    })

    await server.register({
        plugin: require("blipp"),
        options: {
            showAuth: true,
        },
    })

    server.ext("onRequest", function (request, h) {
        request.headers["request-time"] = moment().valueOf()
        return h.continue;
    })

    server.ext("onCredentials", function (request, h) {
        // console.log(`${JSON.stringfy(request.auth.credentials)}`)
        // request.config = 'Taj'
        // let token = (request.headers.authorization).split(" ")[1]
        // let access_api = await Dao.get_value(request.redis_wdb, token)
        // access_api = JSON.parse(access_api)
        return h.continue;
    })

    server.ext("onPreAuth", async (request, h) => {
        request.redis_db = redis_db;
        request.pg = pool;
        return h.continue;
    })

    server.events.on("start", () => {
        redis_db = init_redis(process.env.REDIS_DB)
            .on("connect", () => {  log.info(`Redis connected`); })
            .on("error", (error) => { log.error(error); });
        pool = init_db()
        pool.connect().then((err, client) => log.info(`Postgres connected`))
        pool.on("error", (err) => log.error(`Postgres bad has happened!`, err.stack))
        log.info(`Hapi js(${server.version}) running on ${server.info.uri}`)
    })
    await server.start()
};

process.on("unhandledRejection", (err) => {
    log.error(err)
    process.exit(1)
})

start_server()

module.exports = { server: server };
