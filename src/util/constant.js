"use strict",

    RESOURCES = {
        COMBOBOX_RESOURCE: "master/combobox/v1/",
        MASTER_CUSTOMER_RESOURCE: "master/customer/v1/",
        MASTER_EXPENSE_RESOURCE: "master/expense/v1/",
        MASTER_INQUIRY_RESOURCE: "master/inquiry/v1/",
        INVOICE_TICKET_RESOURCE: "invoice/ticket/v1/",
    },

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
            PASSPORT: "passport",
            AIRLINE: "airline",
            AIRPORT: "airport",
            PAYMENT: "payment",
            DESIGNATION: "Designation",
            BANK: "Bank",
            TICKET_INVOICE: "TicketInvoice",
            DRAFT_TICKET: "DraftTicket",
            CATEGORY: "Category",
            PRODUCT: "Product",
            LEDGER: "Ledger",
            METAPROPERTY: "MetaProperty",
            PACKAGE: "Package",
            COUNTRY: "Country",
        },

        API: {
            CONTEXT: "/api/",
            GET_USER_INFO: "v1/get-user-info",
            SIGN_IN: "v1/sign-in",
            SIGN_OUT: "v1/sign-out",

            // passport enpoint
            GET_PASSPORT_LIST: "v1/passport/get-list",
            SAVE_PASSPORT: "v1/passport/save",


            // Airline enpoint
            GET_AIRLINE: "v1/get-airline",

            // Airport enpoint
            GET_AIRPORT: "v1/get-airport",

            // Customer Endpoints
            GET_CUSTOMER_LIST: "v1/customer/get-list",
            SAVE_CUSTOMER: "v1/customer/save",
            UPDATE_CUSTOMER: "v1/customer/update",

            // Ticket Endpoints 
            GET_TICKET_LIST: "v1/ticket/get-list",
            SAVE_TICKET: "v1/ticket/save",

            // SUPPLIER Endpoints 
            GET_SUPPLIER_LIST: "v1/SUPPLIER/get-list",
            SAVE_SUPPLIER: "v1/SUPPLIER/save",

            // Account Enpoints 
            GET_ACCOUNT_LIST: "v1/account/get-list",

            // Employee Endpoints
            GET_EMPLOYEE_LIST: "v1/employee/get-list",
            SAVE_EMPLOYEE: "v1/employee/save",

            // Department Endpoints 
            GET_DEPARTMENT_LIST: "v1/department/get-list",



            // Airline enpoint
            GET_AIRLINE: "v1/get-airline",

            // Airport enpoint
            GET_AIRPORT: "v1/get-airport",


            // Combobox endpoints
            COMBOBOX_GET_SUPPLIER_LIST: RESOURCES.COMBOBOX_RESOURCE + "supplier-list",
            COMBOBOX_GET_CUSTOMER_LIST: RESOURCES.COMBOBOX_RESOURCE + "customer-list",
            COMBOBOX_GET_AIRLINE_LIST: RESOURCES.COMBOBOX_RESOURCE + "airlines-list",
            COMBOBOX_GET_AIRPORT_LIST: RESOURCES.COMBOBOX_RESOURCE + "airport-list",
            COMBOBOX_GET_PASSPORT_LIST: RESOURCES.COMBOBOX_RESOURCE + "passport-list",
            COMBOBOX_GET_TICKET_FORM_DATA_LIST: RESOURCES.COMBOBOX_RESOURCE + "ticket-form-data-list",


            //Master Customer endpoints
            MASTER_CUSTOMER_GET_LIST: RESOURCES.MASTER_CUSTOMER_RESOURCE + "get-list",

            //Master Expense endpoints 
            MASTER_EXPENSE_GET_LIST: RESOURCES.MASTER_EXPENSE_RESOURCE + "get-list",


            // Master Inquiry endpoints
            MASTER_INQUIRY_GET_LIST_PATH: RESOURCES.MASTER_INQUIRY_RESOURCE + "get-list",
            MASTER_INQUIRY_GET_AIRLINE_LIST: RESOURCES.MASTER_INQUIRY_RESOURCE + "airlines-list",
            MASTER_INQUIRY_GET_AIRPORT_LIST: RESOURCES.MASTER_INQUIRY_RESOURCE + "airport-list",
            MASTER_INQUIRY_GET_PASSPORT_LIST: RESOURCES.MASTER_INQUIRY_RESOURCE + "passport-list",
            MASTER_INQUIRY_GET_DESIGNATION_LIST: RESOURCES.MASTER_INQUIRY_RESOURCE + "designation-list",
            MASTER_INQUIRY_GET_DEPARTMENT_LIST: RESOURCES.MASTER_INQUIRY_RESOURCE + "department-list",
            MASTER_INQUIRY_GET_BANK_LIST: RESOURCES.MASTER_INQUIRY_RESOURCE + "bank-list",


            // Invoice Ticket endpoints 
            INVOICE_TICKET_GET_LIST: RESOURCES.INVOICE_TICKET_RESOURCE + "get-list",
            INVOICE_TICKET_GET_TICKET_LIST: RESOURCES.INVOICE_TICKET_RESOURCE + "ticket-list",
            INVOICE_TICKET_GET_DRAFT_TICKET_LIST: RESOURCES.INVOICE_TICKET_RESOURCE + "draft-ticket-list",

        },
        MESSAGE: {
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
        },

        CONSTANT: {
            METHOD_POST: "POST",
            REQUEST_VERSION__DEFAULT: "1.0",
            REQUEST_TIMEOUT_IN_SECONDS__INFINITY: -1,
            REQUEST_RETRY_COUNT__ZERO: 0,
            USER_AGENT: "Mozilla/5.0",
            PREETY_JSON: false,

            REQUEST_RECEIVED: "RequestReceived",
            RESPONSE_SENT: "ResponseSent",
            INVALID_CREDENTIAL: "Invalid Credential",
            REQUEST_CLIENT: "gds",

            PREFIX_NUMBER_LENGTH_NEW: 4,

            POSTGRES_DATE_TIME_FORMAT: "to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS.MS')::timestamp",
            DATE_FORMAT: "yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'",
            JAVA_DATE_TIME_FORMAT: "yyyy-MM-dd HH:mm:ss.SSS",
            JAVA_DATE_FORMAT: "yyyy-MM-dd",
            POSTGRES_DATE_FORMAT: "to_date(?, 'YYYY-MM-DD')::date",

            SERVER_YML: "server.yml",
            PLUGIN_YML: "plugin.yml",
            CONFIG_YML: "config.yml",
            CONFIG_ID: "config-id",

            DRAFT: "Draft",
            ACTIVE: "Active",
            INACTIVE: "Inactive",
            PROCESSING: "Processing",

            ONGOING: "Ongoing",
            COMPLETED: "Completed",

            MANUAL: "Manual",
            AUTO: "Auto",

            TICKET: "Ticket",
            RE_ISSUE_TICKET: "ReIssueTicket",
            MISCELLANEOUSES: "Miscellaneouses",

            YES: "Yes",
            NO: "No",

            WOOD_TYPE_ROUND: "Round",
            WOOD_TYPE_SQUARE: "Square",

            EN_LANGUAGE: "en-US",
            BN_LANGUAGE: "bn-BD",

            ADMIN: "Admin",
            SUPPLIER: "Supplier",
            CUSTOMER: "Customer",
            EMPLOYEE: "Employee",
            EXPENSE: "Expense",
            BOTH: "Both",
            INCOME: "Income",

            PEOPLE_TYPE_USER: "User",


            REFERENCE_TYPE_PEOPLE: "People",
            REFERENCE_TYPE_EMPLOYEE: "Employee",
            ROLE_OID_CUSTOMER: "Customer",
            ROLE_OID_SUPPLIER: "Supplier",

            ACTIVE_STATUS: "A",
            INACTIVE_STATUS: "I",

            LOGIN: "Login",
            LOGOUT: "Logout",

            SUCCESS: "Success",
            FAILED: "Failed",

            BILL: "Bill",
            INVOICE: "Invoice",
            PRODUCTION: "Production",

            OUTPUT_DIR: "output",
            REPORT_DIR: "report",
            //	LOGO_NAME:"logo.png",

            OK: "Ok",
            SUCCESS_OK: "Ok",

            INSERT: "Insert",
            UPDATE: "Update",
            MODIFICATION: "Modification",

            DEBIT: "Debit",
            CREDIT: "Credit",
            ALL: "All",

            CREDIT_NOTE: "CreditNote",
            WITHDRAW: "Withdraw",
            CREDIT_NOTE_ADJUSTMENT: "CreditNoteAdjustment",
            CASH_ADJUSTMENT: "CashAdjustment",
            CUSTOMER_LEDGER_REPORT: "customerLedger",
            SUPPLIER_LEDGER_REPORT: "SUPPLIERLedger",
            CUSTOMER_TICKET_LEDGER_REPORT: "customerTicketLedger",
            SUPPLIER_TICKET_LEDGER_REPORT: "SUPPLIERTicketLedger",

            TICKET_DETAIL_BY_DATE_REPORT: "ticketDetailByDate",
            TICKET_DETAIL_BY_CUSTOMER_REPORT: "ticketDetailByCustomer",

            TICKET_DETAIL_BY_SUPPLIER_REPORT: "ticketDetailBySupplier",
            SUPPLIER_PAYMENT_DETAIL_REPORT: "supplierPaymentDetailReport",
            TICKET_PROFIT_LOSS_STATEMENT_REPORT: "ticketProfitLossStatement",
            CUSSTOMER_TICKET_PROFIT_LOSS_STATEMENT_REPORT: "customerTicketProfitLossStatement",
            CUSTOMER_TICKET_PROFIT_LOSS_STATEMENT_REPORT: "customerTicketProfitLossStatement",
            TICKET_PROFIT_LOSS_SUMMARY_STATEMENT_REPORT: "ticketProfitLossSummaryStatement",

            CUSTOMER_WELCOME_EMAIL: "customerwelcomeemail",
            NEW_CUSTOMER_REGISTRATION_EMAIL: "customerregistrationemail",
            COMPANY_SIGNUP_WELCOME_EMAIL: "companysignupwelcomemail",
            COMPANY_SIGNUP_WELCOME_EMAIL_TEMPLATE_FOR_US: "companysignupnotificationmail",
            CUSTOMER_PASSPORT_INFORMATION_VERIFICATION_EMAIL: "customerpassportverificationemail",
            SUPPLIER_DEPOSIT_EMAIL: "SUPPLIERdepositemail",

            SEND_TICKET_EMAIL: "sendticketemail",
            SEND_INVOICE_EMAIL: "sendinvoiceemail",
            SEND_PASSPORT_EMAIL: "sendpassportemail",
        }
    }
