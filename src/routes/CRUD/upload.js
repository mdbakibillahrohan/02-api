"use strict"

const path = require("path")
const fs = require("fs")
const log = require("../../util/log")
const uuid = require("uuid")
const { API } = require("../../util/constant")

const route_controller = {
    method: "POST",
    path: API.CONTEXT + API.UPLOAD_DOCUMENT,
    options: {
        // auth: {
        //     mode: "required",
        //     strategy: "jwt",
        // },
        description: "Upload Document",
        plugins: { hapiAuthorization: false },
        payload: {
            maxBytes: 1048576,
            parse: true,
            output: "stream",
            allow: 'multipart/form-data',
            multipart: {
                output: "stream"
            },
        }
    },
    handler: async (request, h) => {
        log.info(`Document upload request received`)
        const response = await handle_request(request, h)
        log.info(`Document upload response sent`)
        return h.response(response)
    },
}

const handle_request = async (request) => {
    try {
        let ext = path.extname(request.payload['file'].hapi.filename)
        const filename = uuid.v4() + ext
        if (!ext.match(/\.(jpe?g|png|pdf|xlsx|xls|csv)$/i)) {
            log.warn(`File extension does not match jpg/jpeg/png/pdf/xlsx/xls/csv`)
            return { code: 400, status: false, message: 'File extension does not match jpg/jpeg/png/pdf/xlsx/xls/csv' }
        }
        let file_location = await store_file(request, filename, __dirname + '/files')
        if (file_location == null) {
            log.warn(`Unable to store file`)
            return { code: 400, status: false, message: 'Unable to store file' }
        }
        log.info(`Uploaded file ${filename}`)
        return {
            status: true,
            code: 200,
            filename: filename,
            message: "Document successfully uploaded"
        }
    } catch (e) {
        log.error(`An exception occurred while uploading document : ${e?.message}`)
        return {
            status: false,
            code: 500,
            message: 'Internal server error'
        }
    }
}

const store_file = async (request, file_name, base_dir) => {
    let res = null
    const file_data = request.payload['file']
    const file_dir = base_dir
    const file_location = file_dir + '/' + file_name
    try {
        if (!fs.existsSync(file_dir)) {
            fs.mkdirSync(file_dir)
        }
        const ws = fs.createWriteStream(file_location)
        file_data.pipe(ws)
        res = file_location
    } catch (e) {
        log.error(`An exception occurred while storing file : ${e?.message}`)
    }
    return res
}




module.exports = route_controller
