"use strict",

    RESOURCES = {
        COMBOBOX_RESOURCE: "master/combobox/v1/",
        MASTER_SUPPLIER_RESOURCE: "master/supplier/v1/",
        MASTER_PASSPORT_RESOURCE: "master/passport/v1/",
        MASTER_PAYMENT_RESOURCE: "master/payment/v1/"

    };

module.exports = {

    SCHEMA: {
    },
    TEXT: {
        BEARER: "Bearer",
        ALGORITHM: "HS256"
    },
    TABLE: {
        LOGIN: "login",
        LOGIN_LOG: "loginlog",
        ROLE: "role",

        PASSPORT: "passport",
        AIRLINE: "airline",
        AIRPORT: "airport",

        CUSTOMER: "customer",
        TICKET: "ticket",
        SUPPLIER: "supplier",
        ACCOUNT: "account",
        EMPLOYEE: "employee",
        DEPARTMENT: "department",

    },

    API: {
        CONTEXT: "/api/",
        GET_USER_INFO: "v1/get-user-info",
        SIGN_IN: "v1/sign-in",
        SIGN_OUT: "v1/sign-out",

        // passport enpoint
        GET_PASSPORT_LIST: "v1/passport/get-list",
        SAVE_PASSPORT: "v1/passport/save",


        // Airport enpoint
        GET_AIRPORT: "v1/get-airport",

        // Customer Endpoints
        GET_CUSTOMER_LIST: "v1/customer/get-list",
        SAVE_CUSTOMER: "v1/customer/save",
        UPDATE_CUSTOMER: "v1/customer/update",

        // Ticket Endpoints 
        GET_TICKET_LIST: "v1/ticket/get-list",
        SAVE_TICKET: "v1/ticket/save",

        // Vendor Endpoints 
        GET_VENDOR_LIST: "v1/vendor/get-list",
        SAVE_VENDOR: "v1/vendor/save",

        // Account Enpoints 
        GET_ACCOUNT_LIST: "v1/account/get-list",

        // Employee Endpoints
        GET_EMPLOYEE_LIST: "v1/employee/get-list",
        SAVE_EMPLOYEE: "v1/employee/save",

        // Department Endpoints 
        GET_DEPARTMENT_LIST: "v1/department/get-list",

        // Airport enpoint
        GET_AIRPORT: "v1/get-airport",
        
        // master supplier enpoint
        MASTER_GET_SUPPLIER_LIST_PATH: RESOURCES.MASTER_SUPPLIER_RESOURCE+ "get-list",
        MASTER_GET_SUPPLIER_BY_OID_PATH: RESOURCES.MASTER_SUPPLIER_RESOURCE+ "get-by-oid",MASTER_GET_SUPPLIER_SAVE_UPDATE_PATH: RESOURCES.MASTER_SUPPLIER_RESOURCE+ "save-update",

        // master passport enpoint 
        MASTER_PASSPORT_SAVE_UPDATE_PATH: RESOURCES.MASTER_PASSPORT_RESOURCE + "save-update",
        MASTER_PASSPORT_GET_LIST_PATH: RESOURCES.MASTER_PASSPORT_RESOURCE + "get-list",
        MASTER_PASSPORT_GET_BY_OID_PATH: RESOURCES.MASTER_PASSPORT_RESOURCE + "get-by-oid",
        MASTER_PASSPORT_PROFILE_PATH: RESOURCES.MASTER_PASSPORT_RESOURCE + "passport-profile",


        // master payment enpoint

        MASTER_PAYMENT_SAVE_UPDATE_PATH: RESOURCES.MASTER_PAYMENT_RESOURCE + "save-update",
        MASTER_PAYMENT_GET_LIST_PATH: RESOURCES.MASTER_PAYMENT_RESOURCE + "get-list",
        MASTER_PAYMENT_DELETE_BY_OID_PATH: RESOURCES.MASTER_PAYMENT_RESOURCE + "delete-by-oid",


        // Combobox endpoints
        COMBOBOX_GET_SUPPLIER_LIST: RESOURCES.COMBOBOX_RESOURCE + "supplier-list",
        COMBOBOX_GET_CUSTOMER_LIST: RESOURCES.COMBOBOX_RESOURCE + "customer-list",
        COMBOBOX_GET_AIRLINE_LIST: RESOURCES.COMBOBOX_RESOURCE + "airlines-list",
        COMBOBOX_GET_AIRPORT_LIST: RESOURCES.COMBOBOX_RESOURCE + "airport-list",
        COMBOBOX_GET_PASSPORT_LIST: RESOURCES.COMBOBOX_RESOURCE + "passport-list",
        COMBOBOX_GET_TICKET_FORM_DATA_LIST: RESOURCES.COMBOBOX_RESOURCE + "ticket-form-data-list",


    },
    MESSAGE: {
        NO_DATA_FOUND: `No Data Found`,
        SUCCESS_GET_LIST: "Success ok",
        SUCCESS_SAVE: "Successfully save data into database",
        SUCCESS_UPDATE: "Successfully updated data into database",
        INTERNAL_SERVER_ERROR: "Internal server error",
        REQUEST_MSG_PREFIX: "request_",
        FAIL_HEADER_INVALID_REQUEST_CLIENT: "fail_header_invalid_request_client",
        FAIL_HEADER_INVALID_REQUEST_TYPE: "fail_header_invalid_request_type",
        FAIL_HEADER_INVALID_REQUEST_VERSION: "fail_header_invalid_request_version",
        NULL_PREFIX: "null_",
        EMPTY_PREFIX: "empty_",
        FAIL_UNKNOWN_SECTION: "Invalid property found : fail_unknown_section",
        REQUEST_SUCCESSFULLY_PROCESSED: "OK",
        NULL_HEADER: this.NULL_PREFIX + "header",
        NULL_META: this.NULL_PREFIX + "meta",
        NULL_BODY: this.NULL_PREFIX + "body",
    }
}
