"use strict";

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
        VENDOR: "supplier",
        ACCOUNT: "account",
        EMPLOYEE: "employee",
        DEPARTMENT: "department",

    },

    API: {
        CONTEXT: "/api",
        GET_USER_INFO: "/v1/get-user-info",
        SIGN_IN: "/v1/sign-in",
        SIGN_OUT: "/v1/sign-out",

        // passport enpoint
        GET_PASSPORT_LIST: "/v1/passport/get-list",
        SAVE_PASSPORT: "/v1/passport/save",


        // Airline enpoint
        GET_AIRLINE: "/v1/airline/get-list",

        // Airport enpoint
        GET_AIRPORT: "/v1/get-airport",

        // Customer Endpoints
        GET_CUSTOMER_LIST: "/v1/customer/get-list",
        SAVE_CUSTOMER: "/v1/customer/save",
        UPDATE_CUSTOMER: "/v1/customer/update",

        // Ticket Endpoints 
        GET_TICKET_LIST: "/v1/ticket/get-list",
        SAVE_TICKET: "/v1/ticket/save",

        // Vendor Endpoints 
        GET_VENDOR_LIST: "/v1/vendor/get-list",
        SAVE_VENDOR: "/v1/vendor/save",

        // Account Enpoints 
        GET_ACCOUNT_LIST: "/v1/account/get-list",

        // Employee Endpoints
        GET_EMPLOYEE_LIST: "/v1/employee/get-list",
        SAVE_EMPLOYEE: "/v1/employee/save",

        // Department Endpoints 
        GET_DEPARTMENT_LIST: "/v1/department/get-list",



        // Airline enpoint
        GET_AIRLINE: "/v1/airline/get-list",

        // Airport enpoint
        GET_AIRPORT: "/v1/airport/get-list",

    },
    MESSAGE: {
        SUCCESS_SAVE: "Successfully save data into database",
        INTERNAL_SERVER_ERROR: "Internal server error"
    }
};
