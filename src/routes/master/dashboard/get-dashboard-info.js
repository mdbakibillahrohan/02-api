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
        const response = await handle_request(request, h);
        log.debug(`Response sent - ${JSON.stringify(response)}`)
        return h.response(response);
    },
};

const handle_request = async (request, h) => {
    try {
        const data = await get_data(request);
        if ( data.length < 1){
            log.info(MESSAGE.NO_DATA_FOUND);
            return { 
                status: false, 
                code:400,
                message: MESSAGE.NO_DATA_FOUND 
            };
        }
        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_LIST,
            data,

        }
    } catch( err ){
        log.error(`An exception occurred while getting dashboard info list data: ${err?.message}`);
        return {
            status: false,
            code: 500,
            message: MESSAGE.INTERNAL_SERVER_ERROR
        };
    }
}
const get_data = async (request) => {
    try{
        const userInfo = await autheticatedUserInfo(request);

        const total_receivable_amount = await getReceivableAmount(userInfo, request)
        const paid_receivable_amount = await getPaidReceivableAmount(userInfo, request)
        const total_payble_amount = await getPaybleAmount(userInfo, request)
        const paid_payble_amount = await getPaidPaybleAmount(userInfo, request)
        const total_vendor_credit_amount = await getVendorCreditAmount(userInfo, request)
        const paid_vendor_credit_amount = await getPaidVendorCreditAmount(userInfo, request)
        const total_credit_note_amount = await getCreditNoteAmount(userInfo, request)
        const paid_credit_note_amount = await getPaidCreditNoteAmount(userInfo, request)
        const months = await getLastTwelveMonths();
        const credit_amount = await getAmount(userInfo, request, months.month, CONSTANT.CREDIT);
        const debit_amount = await getAmount(userInfo, request, months.month, CONSTANT.DEBIT);
        const start_balance = await getAccountBalanceBeforeDate(userInfo, request, months.startDate)
        const end_balance = await getAccountBalanceTillDate(userInfo, request, months.endDate);
        const total_incoming = await getPaymentAmountByDateRange(userInfo, request, CONSTANT.CREDIT, months.startDate, months.endDate );
        const total_outgoing = await getPaymentAmountByDateRange(userInfo, request, CONSTANT.DEBIT, months.startDate, months.endDate);

        const data_list = {
            total_receivable_amount,
            paid_receivable_amount,
            due_receivable_amount: ( total_receivable_amount - paid_receivable_amount ),
            total_payble_amount,
            paid_payble_amount,
            due_payable: ( total_payble_amount - paid_payble_amount ),
            total_vendor_credit_amount,
            paid_vendor_credit_amount,
            due_vendor_credit: ( total_vendor_credit_amount - paid_vendor_credit_amount),
            total_credit_note_amount,
            paid_credit_note_amount,
            due_credit_note: ( total_credit_note_amount - paid_credit_note_amount),
            months: months.month,
            startDate: months.startDate,
            endDate: months.endDate,
            credit_amount,
            debit_amount,
            start_balance,
            end_balance,
            total_incoming,
            total_outgoing,

        }

        return data_list;
        
    }
    catch (err){
        log.error(`An exception occurred while getting dashboard info list data: ${err?.message}`);
        return {
            status: false,
            code: 500,
            message: MESSAGE.INTERNAL_SERVER_ERROR
        };
    }
}

const getLastTwelveMonths = async () => {
    let months = { month: []};
    const now = new Date();
    now.setDate(1);

    const totalMonth = 12;
    for(let i = 1; i <= totalMonth; i++){
        let d = `${ now.getMonth() < 9? '0'+(now.getMonth() + 1): now.getMonth() + 1}-${now.getFullYear()}`;
        now.setMonth(now.getMonth() - 1);
        months.month.push(d);
        if( i == totalMonth ){
            let startDate = `${ now.getFullYear() }-${ now.getMonth() < 9? '0'+(now.getMonth() + 1): now.getMonth() + 1}-${ now.getDate() < 9? '0'+(now.getDate() + 1) : now.getDate() + 1 }`;
            months.startDate = startDate;
        }else if( i == 1 ){
            const nowDate = new Date();
            months.endDate = `${ nowDate.getFullYear()}-${ nowDate.getMonth() < 9? '0'+(nowDate.getMonth() + 1): nowDate.getMonth() + 1}-${ nowDate.getDate() < 9? '0'+(nowDate.getDate() + 1) : nowDate.getDate() + 1 }`
        }   
    }
   
    return months;

}
const getAmount = async (user, request, months, paymentType) => {
    let amount = [];
    for(let month of months) {
        const a = await getPaymentAmountByMonth(user, request, paymentType, month);
        amount.push(a);
    }
    return amount;
}
const getReceivableAmount = async (userInfo, request) => {
    let receivableAmount = [];
    let data = [];
    let query = `select company_account_receivable($1)`;

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
    let query = `select company_paid_account_receivable($1)`;

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
    let query = `select company_account_payable($1)`;

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
    let query = `select company_paid_account_payable($1)`;

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
    let query = `select company_vendor_credit($1)`;

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
    let query = `select company_paid_vendor_credit($1)`;

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
    let query = `select company_credit_note($1)`;

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
    let query = `select company_paid_credit_note($1)`;

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
     from ${ TABLE.ACCOUNT } where 1 = 1 and companyOid = $2 and status = $3 `;

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


module.exports = route_controller;
 