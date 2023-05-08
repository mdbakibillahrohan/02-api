"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const query_scheme = Joi.object({
    
})

const route_controller = {
    method: "GET",
    path: API.CONTEXT + API.MASTER_DASHBOARD_GET_DASHBOARD_INFO_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Master Dashbord Get Dashbord Info",
        plugins: {
            hapiAuthorization: false,
        },
        validate: {
            query: query_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async(request, h, err) => {
                return h.response({
                    code: 400, status: false, message: err?.message
                }).takeover();
            },
        },
    },
    handler: async(request, h) => {
        log.info(`Request received - ${JSON.stringify(request.query)}`);
        const response = await handle_request(request);
        log.debug(`Response sent - ${JSON.stringify(response)}`)
        return h.response(response);
    },
};

const handle_request = async (request) => {
    let userInfo = await autheticatedUserInfo(request)
    try {

        let data = [];
        let receivable_amount = [];
        let paid_receivable_amount = [];
        let payble_amount = [];
        let paid_payble_amount = [];
        let vendor_credit_amount = [];
        let paid_vendor_credit_amount = [];
        let credit_note_amount = [];
        let paid_credit_note_amount = [];
        let payment_amount_by_month = [];

        data = await get_data(user,request);
        receivable_amount = await getReceivableAmount(userInfo, request)
        paid_receivable_amount = await getPaidReceivableAmount(userInfo, request)
        payble_amount = await getPaybleAmount(userInfo, request)
        paid_payble_amount = await getPaidPaybleAmount(userInfo, request)
        vendor_credit_amount = await getVendorCreditAmount(userInfo, request)
        paid_vendor_credit_amount = await getPaidVendorCreditAmount(userInfo, request)
        credit_note_amount = await getCreditNoteAmount(userInfo, request)
        paid_credit_note_amount = await getPaidCreditNoteAmount(userInfo, request)
        payment_amount_by_month = await getPaymentAmountByMonth(userInfo, request)
        
        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_LIST,
            
        };
    } catch( err ){
        log.error(`An exception occurred while getting supplier list data: ${err?.message}`);
        return {
            status: false,
            code: 500,
            message: MESSAGE.INTERNAL_SERVER_ERROR
        };
    }
}
const getReceivableAmount = async (userInfo, request) => {
    let receivableAmount = [];
    let data = [];
    let query = `select coalesce(sum(amount), 0) from ${ TABLE.PAYMENT } where 1 = 1 and companyOid = $1`;
    // let query = 'select company_account_receivable(?)';

    data.push(userInfo.companyoid);
    let sql = {
        text: query,
        values: data
    }
    try {
        let getData = await Dao.get_data(request.pg, sql);
        if(getData.length < 1){
            log.info(` Receivable amount not found `);
        }
        receivableAmount = getData;
    } catch (err) {
        log.error(err)
        throw new Error(err);
    }
    return receivableAmount;
}
const getPaidReceivableAmount = async (userInfo, request) => {
    let paidReceivableAmount = [];
    let data = [];
    // let query = `select coalesce(sum(amount), 0) from ${ TABLE.PAYMENT } where 1 = 1 and companyOid = $1`;
    let query = 'select company_paid_account_receivable(?)';

    data.push(userInfo.companyoid);
    let sql = {
        text: query,
        values: data
    }
    try {
        let getData = await Dao.get_data(request.pg, sql);
        if(getData.length < 1){
            log.info(` Receivable paid amount not found `);
        }
        paidReceivableAmount = getData;
    } catch (err) {
        log.error(err)
        throw new Error(err);
    }
    return paidReceivableAmount;
}
const getPaybleAmount = async (userInfo, request) => {
    let paybleAmount = [];
    let data = [];
    // let query = `select coalesce(sum(amount), 0) from ${ TABLE.PAYMENT } where 1 = 1 and companyOid = $1`;
    let query = 'select company_account_payable(?)';

    data.push(userInfo.companyoid);
    let sql = {
        text: query,
        values: data
    }
    try {
        let getData = await Dao.get_data(request.pg, sql);
        if(getData.length < 1){
            log.info(` payble amount not found `);
        }
        paybleAmount = getData;
    } catch (err) {
        log.error(err)
        throw new Error(err);
    }
    return paybleAmount;
}
const getPaidPaybleAmount = async (userInfo, request) => {
    let paidPaybleAmount = [];
    let data = [];
    // let query = `select coalesce(sum(amount), 0) from ${ TABLE.PAYMENT } where 1 = 1 and companyOid = $1`;
    let query = 'select company_paid_account_payable(?)';

    data.push(userInfo.companyoid);
    let sql = {
        text: query,
        values: data
    }
    try {
        let getData = await Dao.get_data(request.pg, sql);
        if(getData.length < 1){
            log.info(` paid payble amount not found `);
        }
        paidPaybleAmount = getData;
    } catch (err) {
        log.error(err)
        throw new Error(err);
    }
    return paidPaybleAmount;
}
const getVendorCreditAmount = async (userInfo, request) => {
    let vendorCreditAmount = [];
    let data = [];
    // let query = `select coalesce(sum(amount), 0) from ${ TABLE.PAYMENT } where 1 = 1 and companyOid = $1`;
    let query = 'select company_vendor_credit(?)';

    data.push(userInfo.companyoid);
    let sql = {
        text: query,
        values: data
    }
    try {
        let getData = await Dao.get_data(request.pg, sql);
        if(getData.length < 1){
            log.info(` paid vendor credit data not found `);
        }
        vendorCreditAmount = getData;
    } catch (err) {
        log.error(err)
        throw new Error(err);
    }
    return vendorCreditAmount;
}
const getPaidVendorCreditAmount = async (userInfo, request) => {
    let paidVendorCreditAmount = [];
    let data = [];
    // let query = `select coalesce(sum(amount), 0) from ${ TABLE.PAYMENT } where 1 = 1 and companyOid = $1`;
    let query = 'select company_paid_vendor_credit(?)';

    data.push(userInfo.companyoid);
    let sql = {
        text: query,
        values: data
    }
    try {
        let getData = await Dao.get_data(request.pg, sql);
        if(getData.length < 1){
            log.info(` paid vendor credit no data found `);
        }
        paidVendorCreditAmount = getData;
    } catch (err) {
        log.error(err)
        throw new Error(err);
    }
    return paidVendorCreditAmount;
}
const getCreditNoteAmount = async (userInfo, request) => {
    let creditNoteAmount = [];
    let data = [];
    // let query = `select coalesce(sum(amount), 0) from ${ TABLE.PAYMENT } where 1 = 1 and companyOid = $1`;
    let query = 'select company_credit_note(?)';

    data.push(userInfo.companyoid);
    let sql = {
        text: query,
        values: data
    }
    try {
        let getData = await Dao.get_data(request.pg, sql);
        if(getData.length < 1){
            log.info(` credit Note Amount no data found `);
        }
        creditNoteAmount = getData;
    } catch (err) {
        log.error(err)
        throw new Error(err);
    }
    return creditNoteAmount;
}
const getPaidCreditNoteAmount = async (userInfo, request) => {
    let paidCreditNoteAmount = [];
    let data = [];
    // let query = `select coalesce(sum(amount), 0) from ${ TABLE.PAYMENT } where 1 = 1 and companyOid = $1`;
    let query = 'select company_paid_credit_note(?)';

    data.push(userInfo.companyoid);
    let sql = {
        text: query,
        values: data
    }
    try {
        let getData = await Dao.get_data(request.pg, sql);
        if(getData.length < 1){
            log.info(` paid credit Note Amount no data found `);
        }
        paidCreditNoteAmount = getData;
    } catch (err) {
        log.error(err)
        throw new Error(err);
    }
    return paidCreditNoteAmount;
}
const getPaymentAmountByMonth = async (userInfo, request, paymentType, month) => {
    let paymentAmountByMonth = [];
    let data = [];
    let query = `select coalesce(sum(amount), 0) from ${ TABLE.PAYMENT } where 1 = 1 and companyOid = $1 and status = $2 and paymentType = $3 and to_char(paymentdate, 'Mon-YY') = $4 `;

    data.push(userInfo.companyoid, CONSTANT.ACTIVE, paymentType, month );
    let sql = {
        text: query,
        values: data
    }
    try {
        let getData = await Dao.get_data(request.pg, sql);
        if(getData.length < 1){
            log.info(` payment Amount by month no data found `);
        }
        paymentAmountByMonth = getData;
    } catch (err) {
        log.error(err)
        throw new Error(err);
    }
    return paymentAmountByMonth;
}
const getAccountBalanceBeforeDate = async (userInfo, request, date) => {
    let accountBalance = [];
    let data = [];
    let query = `select coalesce(sum(account_balance_before_date(oid, $1)), 0) from ${ TABLE.ACCOUNT } where 1 = 1 and companyOid = $2 and status = $3 `;

    data.push( date, userInfo.companyoid, CONSTANT.ACTIVE );
    let sql = {
        text: query,
        values: data
    }
    try {
        let getData = await Dao.get_data(request.pg, sql);
        if(getData.length < 1){
            log.info(` no data found `);
        }
        accountBalance = getData;
    } catch (err) {
        log.error(err)
        throw new Error(err);
    }
    return accountBalance;
}
const getAccountBalanceTillDate = async (userInfo, request, date) => {
    let data_list = [];
    let data = [];
    let query = `select coalesce(sum(account_balance_till_date(oid, $1)), 0)
     from ${ Table.ACCOUNT } where 1 = 1 and companyOid = $2 and status = $3 `;

    data.push( date, userInfo.companyoid, CONSTANT.ACTIVE );
    let sql = {
        text: query,
        values: data
    }
    try {
        let getData = await Dao.get_data(request.pg, sql);
        if(getData.length < 1){
            log.info(` no data found `);
        }
        data_list = getData;
    } catch (err) {
        log.error(err)
        throw new Error(err);
    }
    return data_list;
}
const getPaymentAmountByDateRange = async (userInfo, request, paymentType, startDate, endDate) => {
    let data_list = [];
    let data = [];
    /* let query = `select coalesce(sum(amount), 0) from ${ TABLE.PAYMENT } where 1 = 1 and companyOid = $1 and status = $2 and paymentType = $3  and 
    accountoid is not null and accountoid <> '' and 
    paymentdate >= to_date($4, 'YYYY-MM-DD')::date and 
     paymentdate <= to_date($5, 'YYYY-MM-DD')::date `;   */

    let query = `select coalesce(sum(amount), 0) from ${ TABLE.PAYMENT } 
    where 1 = 1 and companyOid = $1 and status = $2 and paymentType = $3  and 
    accountoid is not null and accountoid <> '' and 
    paymentdate >= to_date($4, 'YYYY-MM-DD')::date and 
    paymentdate <= to_date($5, 'YYYY-MM-DD')::date `;

    data.push( userInfo.companyoid, CONSTANT.ACTIVE, paymentType, startDate, endDate);
    let sql = {
        text: query,
        values: data
    }
    try {
        let getData = await Dao.get_data(request.pg, sql);
        if(getData.length < 1){
            log.info(` no data found `);
        }
        data_list = getData;
    } catch (err) {
        log.error(err)
        throw new Error(err);
    }
    return data_list;
}

const get_data = async (userInfo,request) => {
    const user = userInfo;
    let list_data = [];
    let data = [];
    let query = ``;
    
    data.push( CONSTANT.ACTIVE ,user.companyoid);
    let idx = 3;
    if (request.query["searchText"]) {
        query += ` and c.name ilike $${idx} or 
            c.ledgerType ilike $${++idx}  `;
        data.push(`% ${request.query["searchText"].trim()} %`)
    }

    query += ` order by p.createdOn desc`;

    if (request.query.offset) {
        query += ` offset $${idx++}`;
        data.push(request.query.offset);
    }
    if (request.query.limit) {
        query += ` limit $${idx++}`;
        data.push(request.query.limit)
    }
    let sql = {
        text: query,
        values: data 
    }
    try {
        list_data = await Dao.get_data(request.pg, sql);
    } catch (e) {
        throw new Error(e);
    }
    return list_data;
}
module.exports = route_controller;
 