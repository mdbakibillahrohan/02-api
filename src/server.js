"use strict"

const pg = require("pg")
const uuid = require("uuid")
const Path = require("path")
const Dao = require("./util/dao")
const log = require("./util/log")
const Hapi = require("@hapi/hapi")
const Helper = require("./util/helper")
var moment = require("moment-timezone")
const Constant = require("./util/constant")
const { stringify } = require("querystring")
require("dotenv").config({ path: `./src/env/.env.${process.env.NODE_ENV}` })

let server

const init_db = () => {
	const pool = new pg.Pool({
		user: process.env.DB_USER,
		host: process.env.DB_HOST,
		database: process.env.DB_NAME,
		password: process.env.DB_PASSWORD,
		port: process.env.DB_PORT,
		max: 20, // set pool max size to 20
		idleTimeoutMillis: 30000, // close idle clients after 30 second
		connectionTimeoutMillis: 2000, // return an error after 2 second if connection could not be established
		maxUses: 7500, // close (and replace) a connection after it has been used 7500 times (see below for discussion)
	})
	return pool
}

const start_server = async () => {
	const pool = init_db()
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
		tokenType: Constant.BEARER,
		key: process.env.ACCESS_TOKEN_SECRET,
		verifyOptions: { ignoreExpiration: false, algorithms: [Constant.ALGORITHM] },
		validate: async (decoded, request, h) => {
			let user = await Helper.get_access_token_from_db(request)
			if (user == null) {
				return { isValid: false, errorMessage: "Invalid token" }
			}
			if (user["status"].toLowerCase() != "signin") {
				return { isValid: false, errorMessage: "Already signout" }
			}

			let sign_out_time = moment(user["sign_out_time"], "YYYY-MM-DD HH:mm:ss.SSS").tz("Asia/Dhaka")
			if (sign_out_time.isBefore(moment())) {
				return { isValid: false, errorMessage: "Token expired" }
			}
			return { isValid: true, credentials: decoded }
		},
	})

	await server.register({
		plugin: require("hapi-auto-route"),
		options: {
			routes_dir: Path.join(__dirname, "routes"),
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

	await server.register({
		plugin: require("hapi-alive"),
		options: {
			path: Constant.API.CONTEXT + Constant.API.HEALTH_CHECK,
			responses: {
				healthy: {
					message: "Application is running...",
				},
			},
		},
	})

	await server.register({
		plugin: require("hapijs-status-monitor"),
		options: {
			title: "Status",
			path: Constant.API.CONTEXT + Constant.API.STATUS,
			routeConfig: {
				auth: false,
			},
		},
	})

	server.ext("onRequest", function (request, h) {
		request.headers["request-time"] = moment().tz("Asia/Dhaka").valueOf()
		return h.continue
	})

	server.ext("onPreAuth", async (request, h) => {
		request.pg = pool
		return h.continue
	})

	server.ext('onPreResponse', async (request, h) => {
		await insert_api_log(request, h)
		return h.continue
	})

	server.events.on("start", () => {
		pool.connect().then((err, client, release) => log.info(`Postgres connected`))
		pool.on("error", (err) => {
			log.error(`Postgres bad has happened!`, err.stack)
		})
		log.info(`Hapi js(${server.version}) running on ${server.info.uri}`)
	})

	await server.start()
}

const insert_api_log = async (request, h) => {
	let start_time = request.headers["request-time"]
	let end_time = moment().tz("Asia/Dhaka").valueOf()
	let created_by = request.auth.credentials == null ? null : request.auth.credentials.login_id;
	let company_oid = request.auth.credentials == null ? null : request.auth.credentials.company_oid;
	let request_json = request.method == 'post' ? request.payload : request.query

	let sql = {
		text: `insert into api_log (oid, route_name, request_json, response_json, request_on, response_on, duration_in_ms, created_by, company_oid, service_name)
			values (uuid(), $1, $2, $3, to_timestamp($4/1000.0), to_timestamp($5/1000.0), $6, $7, $8, $9)`,
		values: [request.url.pathname, request_json, request.response.source, start_time, end_time,
		(end_time - start_time), created_by, company_oid, '02-gds-api']
	}
	try {
		const a = await Dao.execute_value(request.pg, sql)
		console.log(a)
	} catch (e) {
		log.error(`An exception occurred while inserting api_log : ${e?.message}`)
	}
}

process.on("unhandledRejection", (err) => {
	log.error(err)
	process.exit(1)
})

start_server()

module.exports = {
	server: server
}
