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
        LOGIN_LOG: "login_log",
        ROLE: "role",
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

        // Customer Endpoints
        GET_CUSTOMER_LIST: "/v1/customer/get-list",
        SAVE_CUSTOMER: "/v1/customer/save",
        UPDATE_CUSTOMER: "/v1/customer/update",

        // Ticket Endpoints 
        GET_TICKET_LIST: "/v1/ticket/get-list",

        // Vendor Endpoints 
        GET_VENDOR_LIST: "/v1/vendor/get-list",

        // Account Enpoints 
        GET_ACCOUNT_LIST: "/v1/account/get-list",

        // Employee Endpoints
        GET_EMPLOYEE_LIST: "/v1/employee/get-list",

        // Department Endpoints 
        GET_DEPARTMENT_LIST: "/v1/department/get-list",
    }
};
