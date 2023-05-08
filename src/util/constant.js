"use strict",

    RESOURCES = {
        MASTER_DASHBOARD_RESOURCE: "master/dashboard/v1/",
        TICKET_DASHBOARD_RESOURCE: "ticket/dashboard/v1/",
        COMBOBOX_RESOURCE: "master/combobox/v1/",
        MASTER_TRANSACTION_RESOURCE: "master/transaction/v1/",
        MASTER_ACCOUNT_RESOURCE: "master/account/v1/",
        MASTER_CUSTOMER_RESOURCE: "master/customer/v1/",
        MASTER_EXPENSE_RESOURCE: "master/expense/v1/",
        MASTER_INQUIRY_RESOURCE: "master/inquiry/v1/",
        MASTER_SUPPLIER_RESOURCE: "master/supplier/v1/",
        MASTER_PASSPORT_RESOURCE: "master/passport/v1/",
        MASTER_PAYMENT_RESOURCE: "master/payment/v1/",
        MASTER_LEDGER_RESOURCE: "master/ledger/v1/",
        INVOICE_MISCELLANEOUSES_RESOURCE: "invoice/miscellaneouses/v1/",
        INVOICE_TICKET_RESOURCE: "invoice/ticket/v1/",
        TICKET_MODIFICATION_RESOURCE: "ticket/modification/v1/",
        TICKET_DEPARTURE_CARD_RESOURCE: "ticket/departure/card/v1/",
        PAYMENT_RECEIVED_RESOURCE : "payment/received/v1/",
        PAYMENT_MADE_RESOURCE : "payment/made/v1/",

    };

module.exports = {

    SCHEMA: {
    },
    TEXT: {
        BEARER: "Bearer",
        ALGORITHM: "HS256"
    },
    TABLE: {
        ANTARIKA_REQUEST_LOG  : "AntarikaRequestLog",
        ROLE  : "Role",
        LOGIN  : "Login" ,
        LOGIN_TRAIL  : "LoginLog" ,
        SMS_INFORMATION  : "SmsLog" ,
        METAPROPERTY  : "MetaProperty" ,
        COMPANY  : "Company" ,
        CATEGORY  : "Category" ,
        LEDGER  : "Ledger" ,
        PRODUCT  : "Product" ,
        PACKAGE : "Package" ,
        COUNTRY : "Country" ,
        SUPPLIER  : "Supplier" ,
        EXPENSE_SUMMARY  : "ExpenseSummary" ,
        EXPENSE_DETAIL  : "ExpenseDetail" ,
        SUPPLIER_EMAIL_SERVICE  : "SupplierEmailService" ,
        CUSTOMER  : "Customer" ,
        PASSPORT  : "Passport" ,
        PASSPORT_DETAIL  : "PassportDetail" ,
        PASSPORT_COMMAND  : "PassportCommand" ,
        PASSENGER_NOTIFICATION  : "PassengerNotification" ,
        PASSPORT_VISA_INFORMATION  : "PassportVisaInformation" ,
        AIRPORT  : "Airport" ,
        AIRLINE  : "Airline" ,
        DEPARTURE_CARD  : "DepartureCard" ,
        TICKET_INVOICE  : "TicketInvoice" ,
        TICKET  : "Ticket" ,
        DRAFT_TICKET  : "DraftTicket" ,
        ROUTE  : "Route" ,
        TAX  : "Tax" ,
        TICKET_INVOICE_LOG  : "TicketInvoiceLog" ,
        TICKET_LOG  : "TicketLog" ,
        ACCOUNT  : "Account" ,
        PAYMENT  : "Payment" ,
        INVOICE_BILL_PAYMENT  : "InvoiceBillPayment" ,
        ACCOUNT_TRANSACTION  : "AccountTransaction" ,
        V_SUPPLIER_LEDGER  : "v_supplier_ledger" ,
        V_CUSTOMER_LEDGER  : "v_customer_ledger" ,
        V_SUPPLIER_TICKET_LEDGER  : "v_supplier_ticket_ledger" ,
        V_CUSTOMER_TICKET_LEDGER  : "v_customer_ticket_ledger" ,
      
  
        DEPARTMENT  : "Department" ,
        DESIGNATION  : "Designation" ,
        EMPLOYEE  : "Employee" ,
        BANK  : "Bank" ,
        CALENDAR  : "Calendar" ,
        COMPANY_CALENDAR  : "CompanyCalendar" ,
        EMPLOYEE_SALARY  : "EmployeeSalary" ,
        MOBILE_BILL  : "MobileBill" ,

        LOGIN: "login",
        LOGIN_LOG: "loginlog",
        ROLE: "role",

        PASSPORT: "passport",
        PASSPORT_DETAIL: "passportdetail", 
        PASSPORT_VISA_INFORMATION: "passportvisainformation",
        PASSPORT_COMMAND: "passportcommand",
        AIRLINE: "airline",
        AIRPORT: "airport",

        PAYMENT: "payment",
        LEDGER: "ledger",
        CUSTOMER: "customer",
        TICKET: "ticket",
        TICKET_INVOICE: "ticketinvoice",
        VENDOR: "supplier",
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

        // master ledger enpoint
        MASTER_LEDGER_GET_LIST_PATH: RESOURCES.MASTER_LEDGER_RESOURCE + "get-list",
        MASTER_LEDGER_SAVE_PATH: RESOURCES.MASTER_LEDGER_RESOURCE + "save",
        MASTER_LEDGER_UPDATE_PATH: RESOURCES.MASTER_LEDGER_RESOURCE + "update",

        // master transaction enpoint
        MASTER_TRANSACTION_GET_LIST_PATH: RESOURCES.MASTER_TRANSACTION_RESOURCE + "get-list",
        MASTER_TRANSACTION_SAVE_PATH: RESOURCES.MASTER_TRANSACTION_RESOURCE + "save",
        MASTER_TRANSACTION_UPDATE_PATH: RESOURCES.MASTER_TRANSACTION_RESOURCE + "update",

        // master account enpoint
        MASTER_ACCOUNT_GET_LIST_PATH : RESOURCES.MASTER_ACCOUNT_RESOURCE + "get-list",
        MASTER_ACCOUNT_SAVE_PATH : RESOURCES.MASTER_ACCOUNT_RESOURCE + "save",
        MASTER_ACCOUNT_UPDATE_PATH : RESOURCES.MASTER_ACCOUNT_RESOURCE + "update",

        // Combobox endpoints
        COMBOBOX_GET_SUPPLIER_LIST: RESOURCES.COMBOBOX_RESOURCE + "supplier-list",
        COMBOBOX_GET_CUSTOMER_LIST: RESOURCES.COMBOBOX_RESOURCE + "customer-list",
        COMBOBOX_GET_AIRLINE_LIST: RESOURCES.COMBOBOX_RESOURCE + "airlines-list",
        COMBOBOX_GET_AIRPORT_LIST: RESOURCES.COMBOBOX_RESOURCE + "airport-list",
        COMBOBOX_GET_PASSPORT_LIST: RESOURCES.COMBOBOX_RESOURCE + "passport-list",
        COMBOBOX_GET_TICKET_FORM_DATA_LIST: RESOURCES.COMBOBOX_RESOURCE + "ticket-form-data-list",

        // payment enpoint
        // payment recive v1 enpint 
        PAYMENT_RECEIVED_GET_CREDIT_NOTE_BALANCE_PATH : RESOURCES.PAYMENT_RECEIVED_RESOURCE + "get-credit-note-balance",
        PAYMENT_RECEIVED_GET_DUE_INVOICE_LIST_PATH : RESOURCES.PAYMENT_RECEIVED_RESOURCE + "get-due-invoice-list",
        PAYMENT_RECEIVED_GET_BY_OID_PATH : RESOURCES.PAYMENT_RECEIVED_RESOURCE + "get-by-oid",
        PAYMENT_RECEIVED_PAYMENT_REPORT_BY_OID_PATH : RESOURCES.PAYMENT_RECEIVED_RESOURCE + "payment-report-by-oid",
        PAYMENT_RECEIVED_DELETE_BY_OID_PATH : RESOURCES.PAYMENT_RECEIVED_RESOURCE + "delete-by-oid",
        PAYMENT_RECEIVED_SAVE_PATH : RESOURCES.PAYMENT_RECEIVED_RESOURCE + "save",
        PAYMENT_RECEIVED_UPDATE_PATH : RESOURCES.PAYMENT_RECEIVED_RESOURCE + "update",
        PAYMENT_RECEIVED_GET_LIST_PATH : RESOURCES.PAYMENT_RECEIVED_RESOURCE + "get-list",

        // payment made v1 enpoint
        PAYMENT_MADE_GET_CREDIT_NOTE_BALANCE_PATH : RESOURCES.PAYMENT_MADE_RESOURCE + "get-credit-note-balance",
        PAYMENT_MADE_GET_DUE_INVOICE_LIST_PATH : RESOURCES.PAYMENT_MADE_RESOURCE + "get-due-invoice-list",
        PAYMENT_MADE_GET_BY_OID_PATH : RESOURCES.PAYMENT_MADE_RESOURCE + "get-by-oid",
        PAYMENT_MADE_DELETE_BY_OID_PATH : RESOURCES.PAYMENT_MADE_RESOURCE + "delete-by-oid",
        PAYMENT_MADE_GET_LIST_PATH : RESOURCES.PAYMENT_MADE_RESOURCE + "get-list",
        PAYMENT_MADE_SAVE_PATH : RESOURCES.PAYMENT_MADE_RESOURCE + "save",
        PAYMENT_MADE_UPDATE_PATH : RESOURCES.PAYMENT_MADE_RESOURCE + "update",

        // ticket enpoint
        // ticket-departure-card enpoint 
        TICKET_DEPARTURE_CARD_GET_LIST_PATH : RESOURCES.TICKET_DEPARTURE_CARD_RESOURCE + "get-list",
        TICKET_DEPARTURE_CARD_GET_BY_OID_PATH : RESOURCES.TICKET_DEPARTURE_CARD_RESOURCE + "get-by-oid",
        TICKET_DEPARTURE_CARD_GET_BY_TICKET_OID_PATH : RESOURCES.TICKET_DEPARTURE_CARD_RESOURCE + "get-by-ticketoid",
        TICKET_DEPARTURE_CARD_SAVE_PATH : RESOURCES.TICKET_DEPARTURE_CARD_RESOURCE + "save",
        TICKET_DEPARTURE_CARD_UPDATE_PATH : RESOURCES.TICKET_DEPARTURE_CARD_RESOURCE + "update",
        TICKET_DEPARTURE_CARD_DELETE_BY_OID_PATH : RESOURCES.TICKET_DEPARTURE_CARD_RESOURCE + "delete-by-oid",
        // ticket modification enpoint
        TICKET_MODIFICATION_GET_LIST_PATH: RESOURCES.TICKET_MODIFICATION_RESOURCE + "get-list",
        TICKET_MODIFICATION_REISSUE_INVOICE_UPDATE_PATH: RESOURCES.TICKET_MODIFICATION_RESOURCE + "reissue-invoice-update",
        TICKET_MODIFICATION_REISSUE_INVOICE_BY_OID_PATH: RESOURCES.TICKET_MODIFICATION_RESOURCE + "reissue-invoice-by-oid",
        TICKET_MODIFICATION_REISSUE_TICKET_BY_OID_PATH: RESOURCES.TICKET_MODIFICATION_RESOURCE + "reissue-ticket-by-oid",
        TICKET_MODIFICATION_REISSUE_TICKET_LIST_BY_TICKETOID_PATH: RESOURCES.TICKET_MODIFICATION_RESOURCE + "reissue-ticket-list-by-ticketoid",
        TICKET_MODIFICATION_SAVE_PATH: RESOURCES.TICKET_MODIFICATION_RESOURCE + "save",
        TICKET_MODIFICATION_UPDATE_PATH: RESOURCES.TICKET_MODIFICATION_RESOURCE + "update",

        // Master Dashboard enpoint
        MASTER_DASHBOARD_GET_DASHBOARD_INFO_PATH: RESOURCES.MASTER_DASHBOARD_RESOURCE + "get-dashboard-info",

        // Master Ticket Dashboard enpoint
        TICKET_DASHBOARD_GET_DASHBOARD_INFO_PATH: RESOURCES.TICKET_DASHBOARD_RESOURCE + "get-ticket-dashboard-data",
        //Master Customer enpoint
        MASTER_CUSTOMER_GET_LIST: RESOURCES.MASTER_CUSTOMER_RESOURCE + "get-list",

        //Master Expense enpoints 
        MASTER_EXPENSE_GET_LIST: RESOURCES.MASTER_EXPENSE_RESOURCE + "get-list",


        // Master Inquiry endpoints
        MASTER_INQUIRY_GET_LIST_PATH: RESOURCES.MASTER_INQUIRY_RESOURCE + "get-list",
        MASTER_INQUIRY_GET_AIRLINE_LIST: RESOURCES.MASTER_INQUIRY_RESOURCE + "airlines-list",
        MASTER_INQUIRY_GET_AIRPORT_LIST: RESOURCES.MASTER_INQUIRY_RESOURCE + "airport-list",
        MASTER_INQUIRY_GET_PASSPORT_LIST: RESOURCES.MASTER_INQUIRY_RESOURCE + "passport-list",
        MASTER_INQUIRY_GET_DESIGNATION_LIST: RESOURCES.MASTER_INQUIRY_RESOURCE + "designation-list",
        MASTER_INQUIRY_GET_DEPARTMENT_LIST: RESOURCES.MASTER_INQUIRY_RESOURCE + "department-list",
        MASTER_INQUIRY_GET_BANK_LIST: RESOURCES.MASTER_INQUIRY_RESOURCE + "bank-list",

        // Invoice miscellaneuses endpoints
        INVOICE_MISCELLANEOUSES_GET_LIST_PATH : RESOURCES.INVOICE_MISCELLANEOUSES_RESOURCE + "get-list",
        INVOICE_MISCELLANEOUSES_GET_BY_OID_PATH : RESOURCES.INVOICE_MISCELLANEOUSES_RESOURCE + "get-by-oid",
        INVOICE_MISCELLANEOUSES_SAVE_PATH : RESOURCES.INVOICE_MISCELLANEOUSES_RESOURCE + "save",
        INVOICE_MISCELLANEOUSES_UPDATE_PATH : RESOURCES.INVOICE_MISCELLANEOUSES_RESOURCE + "update",


        // Invoice Ticket endpoints 
        INVOICE_TICKET_GET_LIST: RESOURCES.INVOICE_TICKET_RESOURCE + "get-list",
        INVOICE_TICKET_GET_TICKET_LIST: RESOURCES.INVOICE_TICKET_RESOURCE + "ticket-list",
        INVOICE_TICKET_GET_DRAFT_TICKET_LIST: RESOURCES.INVOICE_TICKET_RESOURCE + "draft-ticket-list",

    },


    MESSAGE: {
        SUCCESS_SAVE: "Successfully save data into database",
        SUCCESS_UPDATE: "Successfully updated data into database",
        SUCCESS_GET_LIST: "Successfully get list data",
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
        NO_DATA_FOUND: "NO data found"
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
        VENDOR_LEDGER_REPORT: "vendorLedger",
        CUSTOMER_TICKET_LEDGER_REPORT: "customerTicketLedger",
        VENDOR_TICKET_LEDGER_REPORT: "vendorTicketLedger",

        TICKET_DETAIL_BY_DATE_REPORT: "ticketDetailByDate",
        TICKET_DETAIL_BY_CUSTOMER_REPORT: "ticketDetailByCustomer",

        TICKET_DETAIL_BY_SUPPLIER_REPORT: "ticketDetailBySupplier",
        SUPPLIER_PAYMENT_DETAIL_REPORT: "supplierPaymentDetailReport",
        TICKET_PROFIT_LOSS_STATEMENT_REPORT: "ticketProfitLossStatement",
        CUSSTOMER_TICKET_PROFIT_LOSS_STATEMENT_REPORT: "customerTicketProfitLossStatement",
        CUSTOMER_TICKET_PROFIT_LOSS_STATEMENT_REPORT: "customerTicketProfitLossStatement",
        TICKET_PROFIT_LOSS_SUMMARY_STATEMENT_REPORT: "ticketProfitLossSummaryStatement",

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
        

        CUSTOMER_WELCOME_EMAIL: "customerwelcomeemail",
        NEW_CUSTOMER_REGISTRATION_EMAIL: "customerregistrationemail",
        COMPANY_SIGNUP_WELCOME_EMAIL: "companysignupwelcomemail",
        COMPANY_SIGNUP_WELCOME_EMAIL_TEMPLATE_FOR_US: "companysignupnotificationmail",
        CUSTOMER_PASSPORT_INFORMATION_VERIFICATION_EMAIL: "customerpassportverificationemail",
        VENDOR_DEPOSIT_EMAIL: "vendordepositemail",

        SEND_TICKET_EMAIL: "sendticketemail",
        SEND_INVOICE_EMAIL: "sendinvoiceemail",
        SEND_PASSPORT_EMAIL: "sendpassportemail",

        getDateTime: (dateTime) => {

        }

    }
}

