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
    },

    API: {
        CONTEXT: "/api",
        GET_USER_INFO: "/v1/get-user-info",
        SIGN_IN: "/v1/sign-in",
        SIGN_OUT: "/v1/sign-out"
    }
};
