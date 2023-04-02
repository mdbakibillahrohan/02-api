"use strict",

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
            GET_PASSPORT_LIST: "/v1/passport/get-list",
            SAVE_PASSPORT: "/v1/passport/save",


            // Airline enpoint
            GET_AIRLINE: "/v1/get-airline",

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
            GET_AIRLINE: "/v1/get-airline",

            // Airport enpoint
            GET_AIRPORT: "/v1/get-airport",


            // These paths are extracted from the java code 
            MASTER_REPORT_V1_CUSTOMER_TICKET_PROFIT_LOSS_STATEMENT_PATH: "customer-ticket-profit-loss-statement", //AUTO-INSERT

            MASTER_REPORT_V1_COMBINED_TICKET_D2_BY_INVOICE_OID_PATH: "combined-ticket-d2-by-invoice-oid", //AUTO-INSERT

            MASTER_REPORT_V1_COMBINED_TICKET_BY_INVOICE_OID_PATH: "combined-ticket-by-invoice-oid", //AUTO-INSERT

            INVOICE_MISCELLANEOUSES_V1_SAVE_UPDATE_PATH: "save-update", //AUTO-INSERT

            INVOICE_MISCELLANEOUSES_V1_GET_BY_OID_PATH: "get-by-oid", //AUTO-INSERT

            INVOICE_MISCELLANEOUSES_V1_GET_LIST_PATH: "get-list", //AUTO-INSERT

            INVOICE_MISCELLANEOUSES_V1_RESOURCE: "invoice/miscellaneouses/v1/", //AUTO-INSERT


            TICKET_MODIFICATION_V1_REISSUE_INVOICE_UPDATE_PATH: "reissue-invoice-update", //AUTO-INSERT

            TICKET_MODIFICATION_V1_REISSUEINVOICE_BY_OID_PATH: "reissueinvoice-by-oid", //AUTO-INSERT

            TICKET_MODIFICATION_V1_GET_LIST_PATH: "get-list", //AUTO-INSERT

            TICKET_MODIFICATION_V1_REISSUETICKET_BY_OID_PATH: "reissueticket-by-oid", //AUTO-INSERT

            TICKET_MODIFICATION_V1_REISSUETICKETLIST_BY_TICKETOID_PATH: "reissueticketlist-by-ticketoid", //AUTO-INSERT

            CONTAINER_RESOURCE: "container/",
            CONTAINER_AVAILABLE_RESOURCE: "/getAvailableResouces",

            TICKET_MODIFICATION_V1_RESOURCE: "ticket/modification/v1/",
            TICKET_MODIFICATION_V1_SAVE_UPDATE_PATH: "save-update",

            MASTER_LEDGER_V1_RESOURCE: "master/ledger/v1/",
            MASTER_LEDGER_V1_SAVE_UPDATE_PATH: "save-update",
            MASTER_LEDGER_V1_GET_LIST_PATH: "get-list",

            MASTER_COMBOBOX_V1_RESOURCE: "master/combobox/v1/",
            MASTER_COMBOBOX_V1_SUPPLIER_LIST_PATH: "supplier-list",
            MASTER_COMBOBOX_V1_CUSTOMER_LIST_PATH: "customer-list",
            MASTER_COMBOBOX_V1_AIRLINES_LIST_PATH: "airlines-list",
            MASTER_COMBOBOX_V1_AIRPORT_LIST_PATH: "airport-list",
            MASTER_COMBOBOX_V1_PASSPORT_LIST_PATH: "passport-list",
            MASTER_COMBOBOX_V1_TICKET_FORM_DATA_LIST_PATH: "ticket-form-data-list",

            PAYMENT_RECEIVED_V1_RESOURCE: "payment/received/v1/",
            PAYMENT_RECEIVED_V1_GET_CREDIT_NOTE_BALANCE_PATH: "get-credit-note-balance",
            PAYMENT_RECEIVED_V1_GET_DUE_INVOICE_LIST_PATH: "get-due-invoice-list",
            PAYMENT_RECEIVED_V1_GET_BY_OID_PATH: "get-by-oid",
            PAYMENT_RECEIVED_V1_PAYMENT_REPORT_BY_OID_PATH: "payment-report-by-oid",
            PAYMENT_RECEIVED_V1_DELETE_BY_OID_PATH: "delete-by-oid",
            PAYMENT_RECEIVED_V1_SAVE_UPDATE_PATH: "save-update",
            PAYMENT_RECEIVED_V1_GET_LIST_PATH: "get-list",

            PAYMENT_MADE_V1_RESOURCE: "payment/made/v1/",
            PAYMENT_MADE_V1_GET_CREDIT_NOTE_BALANCE_PATH: "get-credit-note-balance",
            PAYMENT_MADE_V1_GET_DUE_INVOICE_LIST_PATH: "get-due-invoice-list",
            PAYMENT_MADE_V1_GET_BY_OID_PATH: "get-by-oid",
            PAYMENT_MADE_V1_DELETE_BY_OID_PATH: "delete-by-oid",
            PAYMENT_MADE_V1_SAVE_UPDATE_PATH: "save-update",
            PAYMENT_MADE_V1_GET_LIST_PATH: "get-list",


            AUTHENTICATION_USER_V1_RESOURCE: "authentication/user/v1/",
            AUTHENTICATION_USER_V1_AUTHENTICATE_USER_PATH: "authenticate-user",
            AUTHENTICATION_USER_V1_GET_USER_INFO_PATH: "get-user-info",
            AUTHENTICATION_USER_V1_GET_COMPANY_INFO_PATH: "get-company-info",
            AUTHENTICATION_USER_V1_GET_USER_INFO_BY_OID_PATH: "get-user-info-by-oid",
            AUTHENTICATION_USER_V1_CHANGE_PASSWORD_PATH: "change-password",
            AUTHENTICATION_USER_V1_RESET_PASSWORD_PATH: "reset-password",
            AUTHENTICATION_USER_V1_GET_LIST_PATH: "get-list",
            AUTHENTICATION_USER_V1_LOGOUT_PATH: "logout",
            AUTHENTICATION_USER_V1_SAVE_UPDATE_PATH: "save-update",
            AUTHENTICATION_USER_V1_SAVE_SIGNUP_PATH: "save-signup",

            AUTHENTICATION_ROLE_V1_RESOURCE: "authentication/role/v1/",
            AUTHENTICATION_ROLE_V1_GET_LIST_PATH: "get-list",

            MASTER_INQUIRY_V1_RESOURCE: "master/inquiry/v1/",
            MASTER_INQUIRY_V1_GET_LIST_PATH: "get-list",
            MASTER_INQUIRY_V1_AIRPORT_LIST_PATH: "airport-list",
            MASTER_INQUIRY_V1_AIRLINES_LIST_PATH: "airlines-list",
            MASTER_INQUIRY_V1_PASSPORT_LIST_PATH: "passport-list",
            MASTER_INQUIRY_V1_GET_TICKET_BY_EMAIL_SUBJECT_PATH: "get-ticket-by-email-subject",
            MASTER_INQUIRY_V1_GET_TICKET_BY_PNR_TICKET_NO_PATH: "get-ticket-by-pnr-ticketno",
            MASTER_INQUIRY_V1_DESIGNATION_LIST_PATH: "designation-list",
            MASTER_INQUIRY_V1_DEPARTMENT_LIST_PATH: "department-list",
            MASTER_INQUIRY_V1_BANK_LIST_PATH: "bank-list",
            MASTER_INQUIRY_V1_PACKAGE_DATA_COUNT_PATH: "package-data-count",


            MASTER_REPORT_V1_RESOURCE: "master/report/v1/",
            MASTER_REPORT_V1_REPORT_PATH: "report",
            MASTER_REPORT_V1_UPLOAD_PATH: "upload",
            MASTER_REPORT_V1_SALARY_SHEET_PATH: "salary-sheet",
            MASTER_REPORT_V1_BANK_ADVICE_PATH: "bank-advice",
            MASTER_REPORT_V1_PAY_SLIP_PATH: "payslip",
            MASTER_REPORT_V1_PAYMENT_BY_OID_PATH: "payment-by-oid",

            MASTER_REPORT_V1_PAYMENT_RECEIVED_BY_OID_PATH: "payment-received-by-oid",
            MASTER_REPORT_V1_VENDOR_TICKET_LEDGER_PATH: "vendor-ticket-ledger",
            MASTER_REPORT_V1_CUSTOMER_TICKET_LEDGER_PATH: "customer-ticket-ledger",
            MASTER_REPORT_V1_TICKET_PROFIT_LOSS_SUMMARY_STATEMENT_PATH: "ticket-profit-loss-summary-statement",
            MASTER_REPORT_V1_TICKET_PROFIT_LOSS_STATEMENT_PATH: "ticket-profit-loss-statement",
            MASTER_REPORT_V1_TICKET_SUPPLIER_PAYMENT_PATH: "ticket-supplier-payment",
            MASTER_REPORT_V1_TICKET_DETAIL_BY_SUPPLIER_PATH: "ticket-detail-by-supplier",
            MASTER_REPORT_V1_TICKET_DETAIL_BY_CUSTOMER_PATH: "ticket-detail-by-customer",
            MASTER_REPORT_V1_TICKET_DETAIL_BY_DATE_PATH: "ticket-detail-by-date",

            MASTER_REPORT_V1_REPORT_LOCATION_PATH: "report/location",
            MASTER_REPORT_V1_REPORT_FILE_PATH: "report/file/{fileName}",
            MASTER_REPORT_V1_IMAGES_PATH: "download/{folderName}/{fileName}",
            // MASTER_REPORT_V1_IMAGES_PATH :"images/{image}",
            /*MASTER_REPORT_V1_WOOD_BILL_BY_OID_PATH :"wood-bill-by-oid",
            MASTER_REPORT_V1_WOOD_INVOICE_BY_OID_PATH :"wood-invoice-by-oid",
            MASTER_REPORT_V1_WOOD_STOCK_PATH :"wood-stock",*/
            MASTER_REPORT_V1_VENDOR_LEDGER_PATH: "vendor-ledger",
            MASTER_REPORT_V1_CUSTOMER_LEDGER_PATH: "customer-ledger",

            MASTER_REPORT_V1_INVOICE_TICKET_BY_OID_PATH: "invoice-ticket-by-oid",
            MASTER_REPORT_V1_TICKET_BY_INVOICE_OID_PATH: "ticket-by-invoice-oid",
            MASTER_REPORT_V1_TICKET_DEPARTURE_CARD_PATH: "ticket-departure-card",

            MASTER_DASHBOARD_V1_RESOURCE: "master/dashboard/v1/",
            MASTER_DASHBOARD_V1_GET_DASHBOARD_INFO_PATH: "get-dashboard-info",

            TICKET_DASHBOARD_V1_RESOURCE: "ticket/dashboard/v1/",
            TICKET_DASHBOARD_V1_GET_DASHBOARD_INFO_PATH: "get-ticket-dashboard-data",


            MASTER_EXPENSE_V1_RESOURCE: "master/expense/v1/",
            MASTER_EXPENSE_V1_GET_LIST_PATH: "get-list",
            MASTER_EXPENSE_V1_SAVE_UPDATE_PATH: "save-update",
            MASTER_EXPENSE_V1_GET_BY_OID_PATH: "get-by-oid",


            MASTER_SUPPLIER_V1_RESOURCE: "master/supplier/v1/",
            MASTER_SUPPLIER_V1_GET_LIST_PATH: "get-list",
            MASTER_SUPPLIER_V1_SAVE_UPDATE_PATH: "save-update",
            MASTER_SUPPLIER_V1_GET_BY_OID_PATH: "get-by-oid",

            MASTER_CUSTOMER_V1_RESOURCE: "master/customer/v1/",
            MASTER_CUSTOMER_V1_GET_LIST_PATH: "get-list",
            MASTER_CUSTOMER_V1_SAVE_UPDATE_PATH: "save-update",
            MASTER_CUSTOMER_V1_GET_BY_OID_PATH: "get-by-oid",

            MASTER_PASSPORT_V1_RESOURCE: "master/passport/v1/",
            MASTER_PASSPORT_V1_SAVE_UPDATE_PATH: "save-update",
            MASTER_PASSPORT_V1_GET_BY_OID_PATH: "get-by-oid",
            MASTER_PASSPORT_V1_GET_LIST_PATH: "get-list",
            MASTER_PASSPORT_V1_PASSPORT_PROFILE_PATH: "passport-profile",

            MASTER_PAYMENT_V1_RESOURCE: "master/payment/v1/",
            MASTER_PAYMENT_V1_GET_LIST_PATH: "get-list",
            MASTER_PAYMENT_V1_SAVE_UPDATE_PATH: "save-update",
            MASTER_PAYMENT_V1_DELETE_BY_OID_PATH: "delete-by-oid",

            MASTER_ACCOUNT_V1_RESOURCE: "master/account/v1/",
            MASTER_ACCOUNT_V1_SAVE_UPDATE_PATH: "save-update",
            MASTER_ACCOUNT_V1_GET_LIST_PATH: "get-list",

            MASTER_TRANSACTION_V1_RESOURCE: "master/transaction/v1/",
            MASTER_TRANSACTION_V1_GET_LIST_PATH: "get-list",
            MASTER_TRANSACTION_V1_SAVE_UPDATE_PATH: "save-update",

            INVOICE_TICKET_V1_RESOURCE: "invoice/ticket/v1/",
            INVOICE_TICKET_V1_GET_LIST_PATH: "get-list",
            INVOICE_TICKET_V1_TICKET_LIST_PATH: "ticket-list",
            INVOICE_TICKET_V1_GET_BY_OID_PATH: "get-by-oid",
            INVOICE_TICKET_V1_DRAFT_TICKET_BY_OID_PATH: "draft-ticket-by-oid",
            INVOICE_TICKET_V1_SAVE_UPDATE_PATH: "save-update",
            INVOICE_TICKET_V1_DELETE_BY_OID_PATH: "delete-by-oid",
            INVOICE_TICKET_V1_DELETE_BY_DRAFT_TICKET_OID_PATH: "delete-by-draftticketoid",
            INVOICE_TICKET_V1_DELETE_BY_DRAFT_TICKET_OIDS_PATH: "delete-by-draftticketoids",
            INVOICE_TICKET_V1_DRAFT_TICKET_LIST_PATH: "draft-ticket-list",
            INVOICE_TICKET_V1_DELETE_BY_TICKETOID_PATH: "delete-by-ticketoid",

            TICKET_DEPARTURE_CARD_V1_RESOURCE: "ticket/departure/card/v1/",
            TICKET_DEPARTURE_CARD_V1_GET_LIST_PATH: "get-list",
            TICKET_DEPARTURE_CARD_V1_GET_BY_OID_PATH: "get-by-oid",
            TICKET_DEPARTURE_CARD_V1_GET_BY_TICKET_OID_PATH: "get-by-ticketoid",
            TICKET_DEPARTURE_CARD_V1_SAVE_UPDATE_PATH: "save-update",
            TICKET_DEPARTURE_CARD_V1_DELETE_BY_OID_PATH: "delete-by-oid",

            MASTER_EMAIL_V1_RESOURCE: "master/email/v1/",
            MASTER_EMAIL_V1_SEND_TICKET_PATH: "send-ticket",
            MASTER_EMAIL_V1_SEND_INVOICE_PATH: "send-invoice",
            MASTER_EMAIL_V1_SEND_PASSPORT_PATH: "send-passport",

            PAYROLL_SALARY_V1_RESOURCE: "payroll/salary/v1/",
            PAYROLL_SALARY_V1_GET_SUMMARY_BY_YEAR_PATH: "get-summary-by-year",
            PAYROLL_SALARY_V1_GENERATE_PATH: "generate",
            PAYROLL_SALARY_V1_REMOVE_PATH: "remove",
            PAYROLL_SALARY_V1_UPLOAD_MOBILE_BILL_PATH: "upload-mobile-bill",

            MASTER_SETTINGS_V1_RESOURCE: "master/settings/v1/",
            MASTER_SETTINGS_V1_DEPARTMENT_LIST_PATH: "department-list",
            MASTER_SETTINGS_V1_GET_DEPARTMENT_BY_OID_PATH: "get-department-by-oid",
            MASTER_SETTINGS_V1_DEPARTMENT_SAVE_UPDATE_PATH: "department-save-update",
            MASTER_SETTINGS_V1_DESIGNATION_LIST_PATH: "designation-list",
            MASTER_SETTINGS_V1_GET_DESIGNATION_BY_OID_PATH: "get-designation-by-oid",
            MASTER_SETTINGS_V1_DESIGNATION_SAVE_UPDATE_PATH: "designation-save-update",
            MASTER_SETTINGS_V1_EMPLOYEE_SAVE_UPDATE_PATH: "employee-save-update",
            MASTER_SETTINGS_V1_COMPANY_SAVE_UPDATE_PATH: "company-save-update",
            MASTER_SETTINGS_V1_EMPLOYEE_LIST_PATH: "employee-list",
            MASTER_SETTINGS_V1_GET_EMPLOYEE_BY_OID_PATH: "get-employee-by-oid",
            MASTER_SETTINGS_V1_GET_COMPANY_BY_OID_PATH: "get-company-by-oid",
            MASTER_SETTINGS_V1_USER_PROFILE_SAVE_UPDATE_PATH: "user-profile-save-update",
            MASTER_SETTINGS_V1_GET_USER_PROFILE_INFO_BY_OID_PATH: "get-user-profile-info-by-oid",
            MASTER_SETTINGS_V1_GET_TODAY_TRANSACTION_SUMMARY_PATH: "get-today-transaction-summary",

        },
        MESSAGE: {
            SUCCESS_SAVE: "Successfully save data into database",
            INTERNAL_SERVER_ERROR: "Internal server error"
        }
    }
