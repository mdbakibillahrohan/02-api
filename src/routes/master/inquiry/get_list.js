"use strict";

const Joi = require("@hapi/joi");
const log = require("../../../util/log");
const Dao = require("../../../util/dao");
const { API, MESSAGE, TABLE, CONSTANT } = require("../../../util/constant");
const { autheticatedUserInfo } = require("../../../util/helper");

const query_scheme = Joi.object({
    metaOid: Joi.array().optional(),
});

const get_list = {
    method: "GET",
    path: API.CONTEXT + API.MASTER_INQUIRY_GET_LIST_PATH,
    options: {
        auth: {
            mode: "required",
            strategy: "jwt",
        },
        description: "Inquiry list",
        plugins: { hapiAuthorization: false },
        validate: {
            query: query_scheme,
            options: {
                allowUnknown: false,
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 400, status: false, message: err?.message }).takeover();
            },
        },
    },
    handler: async (request, h) => {
        log.info(`Request received - ${JSON.stringify(request.query)}`);
        const response = await handle_request(request);
        log.debug(`Response sent - ${JSON.stringify(response)}`);
        return h.response(response);
    },
};

const handle_request = async (request) => {
    try {

        let data = [];
        data = await get_data(request)
        log.info(`master inquiry list found`);
        return {
            status: true,
            code: 200,
            message: MESSAGE.SUCCESS_GET_LIST,
            data: data,
        };
    } catch (err) {
        log.error(`An exception occurred while getting master inquiry list data : ${err?.message}`);
        return {
            status: false,
            code: 500,
            message: MESSAGE.INTERNAL_SERVER_ERROR
        };
    }
};



const get_data = async (request) => {
    const metaList = await getMetaPropertyListSql();

    return list_data;
};


const getAccountList = async (request) => {
    const userInfo = await autheticatedUserInfo(request)
    let list_data = [];
    let data = [userInfo.companyoid];
    let query = `select oid, name, accountNumber as "account_number", accountType as "account_type", initialBalance as "initial_balance", account_balance(oid) as "balance" from ${TABLE.ACCOUNT} where 1 = 1 and companyoid = $1 order by createdOn desc`;

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

const getCategoryList = async (request) => {
    const userInfo = await autheticatedUserInfo(request)
    let list_data = [];
    let data = [userInfo.companyoid];
    let query = `select oid, name from ${TABLE.CATEGORY} where 1 = 1 and companyoid = $1 order by createdOn desc`;

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
const getProductListSql = async (request) => {
    const userInfo = await autheticatedUserInfo(request)
    let list_data = [];
    let data = [userInfo.companyoid];
    let query = `select oid, name, unit from ${TABLE.PRODUCT} where 1 = 1 and companyoid = $1 order by createdOn desc`;

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
const getSupplierList = async (request) => {
    const userInfo = await autheticatedUserInfo(request)
    let list_data = [];
    let data = [userInfo.companyoid];
    let query = `select oid, name, email, address, mobileNo as "mobile_no", initialBalance as "initial_balance", commissionType as "commission_type", 
    commissionValue as "commission_value", serviceCharge as "service_charge", supplier_balance(oid) as balance, supplier_creditnote_balance(oid) as "vendor_credit_balance" from ${TABLE.SUPPLIER} where 1 = 1 and companyoid = $1 order by createdOn desc`;

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
const getCustomerListSql = async (request) => {
    const userInfo = await autheticatedUserInfo(request)
    let list_data = [];
    let data = [userInfo.companyoid];
    let query = `select oid, name, email, address, mobileNo as "mobile_no", initialBalance as "initial_balance", discountType as "discount_type", 
    discountValue as "discount_value", customer_balance(oid) as balance, 
    customer_creditnote_balance(oid) as "credit_note_alance" from ${TABLE.CUSTOMER} where 1 = 1 and companyoid = $1 order by createdOn desc`;

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
const getLedgerListSql = async (request) => {
    const userInfo = await autheticatedUserInfo(request)
    let list_data = [];
    let data = [CONSTANT.ACTIVE, userInfo.companyoid];
    let query = `select c.oid, c.name, c.ledgerType as "ledger_type",
    (select coalesce(sum(amount), 0) from ${TABLE.PAYMENT} where 1 = 1 and status = $1 and referenceOid = c.oid) as balance
    from ${TABLE.LEDGER} c
    where 1 = 1 and c.companyOid = $2 order by c.createdOn desc`;

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

const getPeopleListSql = async (request) => {
    const userInfo = await autheticatedUserInfo(request)
    let list_data = [];
    let data = [userInfo.companyoid];
    let query = `select oid, nameEn as name, presentAddress as address, mobileNo as "mobile_no"
    from ${TABLE.EMPLOYEE} where 1 = 1 and companyOid = $1 order by createdOn desc`;

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


const getMetaPropertyListSql = async (request) => {
    const { metaOid } = request.payload;
    let list_data = [];
    let data = metaOid;
    let idx = 1;
    let params = "";
    let query = `select oid, valueJson as "value_json"
    from ${TABLE.METAPROPERTY} where 1 = 1`;
    if (metaOid) {
        for (let i = 1; i <= metaOid.length; i++) {
            params += `$${idx++},`
        }
    }
    query += ` and oid in ${params}`
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



const getPackageListSql = async (request) => {
    let list_data = [];
    let data = [];
    let query = `select oid, name, packageJson as "package_json", description, price, period, type
    from ${TABLE.PACKAGE} where 1 = 1`;

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

const getCountryListSql = async (request) => {
    let list_data = [];
    let data = [];
    let query = `select oid, name, capital, isoCodeAlphaTwo as "iso_code_alpha_two", isoCodeAlphaThree as "iso_code_alpha_three", countryCode as "country_code", dialingCode as "dialing_code"
    from ${TABLE.COUNTRY} where 1 = 1`;

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

const getBankListSql = async (request) => {
    let list_data = [];
    let data = [];
    let query = `select oid, nameEn as "name_en", nameBn as "name_bn"
    from ${TABLE.COUNTRY} where 1 = 1`;

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


module.exports = get_list;
