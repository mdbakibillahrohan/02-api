/**
 * Title: Create Passport 
 * Description: Create New Passport 
 * Author: Nazim
 * Date: 25/01/2023
 * 
 */
'use strick'

// required file module

const log = require("../../util/log");
const Dao = require("../../util/dao");
const Helper = require("../../util/helper");
const {passportSchema }= require("../../schema/passport/passport")
const { API , TABLE } = require("../../util/constant");

// Router controller object 
const router_controller = {
    method: 'POST',
    path: API.CONTEXT + API.CREATE_PASSPORT,
    options: {
        description: " Create Passport",

    },
    
    handler: async (request, h) => {
        log.debug(`Request recived - ${ JSON.stringify( request.payload )}`);
        const response = await handle_request ( request );
        log.debug(`Request send - ${ JSON.stringify( response )}`)
        return h.response(response);               
    }
}

// Handler Request Object 
const handle_request = async ( request ) => {
    let response_from_database = create_new_passport( request );
    if( !response_from_database ) {
        log.info('create new passport failed !');
        return { status: true, code: 201, message: ' create new passport failed ! '}
    }
    log.info( 'Create New Passport Done' );
    return { status: true, code: 200, response: '', message: ' Create New Passport Done '}
}

// Create New Passport Object
const create_new_passport = async ( request ) => {
    let data = null;
    let sql = {
        text: `INSERT INTO ${TABLE.PASSPORT}(${ passportSchema.keys })VALUES(${ request.payload })`
    }
    for(let key of Object.keys( request.payload )){

        console.log( request.payload[ key ] )
    }
}
// Router Controller Object Export
module.exports = router_controller;