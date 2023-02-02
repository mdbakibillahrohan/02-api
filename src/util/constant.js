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
        PASSPORT: "passport",
        AIRLINE: "airline",
        AIRPORT: "airport"
    },

    API: {
        CONTEXT: "/api",
        GET_USER_INFO: "/v1/get-user-info",
        SIGN_IN: "/v1/sign-in",
        SIGN_OUT: "/v1/sign-out",

        // passport enpoint
        GET_PASSPORT: "/v1/get-passport",
        CREATE_PASSPORT: "/v1/create-passport",
        

        // Airline enpoint
        GET_AIRLINE: "/v1/get-airline",

        // Airport enpoint
        GET_AIRPORT: "/v1/get-airport",

    }
};
