"use strict";

module.exports = {
	BEARER: "Bearer",
	ALGORITHM: "HS256",
	TABLE: {
		LOGIN: "login",
		COMPANY: "company",
		ROLE: "role",
		LOGIN_LOG: "login_log",
		DESIGNATION: "designation",
		AIRPORT: "airport",
		PEOPLE: "people",
		AIRLINE: "airline",
		COUNTRY: "country",
		DIVISION: "division",
		DISTRICT: "district",
		THANA: "thana",
		POST_OFFICE: "post_office",
		DEPARTMENT: "department",
		BANK_ACCOUNT: "bank_account",
		PASSPORT: "passport",
		PASSPORT_DETAIL: "passport_detail",
		PASSPORT_COMMAND: "passport_command",
		PASSPORT_VISA_INFORMATION: "passport_visa_information",
		PASSENGER_NOTIFICATION: "passenger_notification",

		LEDGER_GROUP: "ledger_group",
		LEDGER_SUBGROUP: "ledger_subgroup",
		LEDGER: "ledger",
		LEDGER_SETTING: "ledger_setting",
		SUB_LEDGER: "subledger",
		BANK: "bank",
		WAREHOUSE: "warehouse",
		EXPENSE_SUMMARY: "expense_summary",
		CASH_BOOK: "cash_book",
		BANK_TRANSACTION: "bank_transaction",
		EXPENSE_DETAIL: "expense_detail",
		PAYMENT_MADE: "payment_made",
		PAYMENT_RECEIVED: "payment_received",
		PRODUCT_UNIT: "product_unit",
		PRODUCT_CATEGORY: "product_category",
		PRODUCT: "product",
		META_PROPERTY: "meta_property",
		JOURNAL_SUMMARY: "journal_summary",
		ACTIVITY_LOG: "activity_log",
		FINANCIAL_PERIOD: "financial_period",
		CREDIT_NOTE: "credit_note",
		CREDIT_NOTE_REFUND: "credit_note_refund",
		VENDOR_CREDIT: "vendor_credit",
		VENDOR_CREDIT_REFUND: "vendor_credit_refund",

	},
	SCHEMA: {
		PUBLIC: "public",
	},
	ROLE: {
		ADMIN: 'admin'
	},
	TEXT: {

	},
	API: {
		CONTEXT: "/api",
		STATUS: "/monitor/status",
		HEALTH_CHECK: "/monitor/health-check",
		SIGNIN: "/v1/user/signin",
		SIGNOUT: "/v1/user/signout",
		USER_PROFILE_INFO: "/v1/user/get-user-profile",
		GET_META_PROPERTY_BY_OID: "/v1/meta-property/get-by-oid",
		GET_AIRPORT_LIST: "/v1/airport/get-list",
		GET_AIRLINE_LIST: "/v1/airline/get-list",
		GET_COUNTRY_LIST: "/v1/country/get-list",
		GET_DIVISION_LIST: "/v1/division/get-list",
		GET_DISTRICT_LIST: "/v1/district/get-list",
		GET_THANA_LIST: "/v1/thana/get-list",
		GET_POST_OFFICE_LIST: "/v1/post-office/get-list",
		GET_DEPARTMENT_LIST: "/v1/department/get-list",
		GET_BANK_ACCOUNT_LIST: "/v1/bank-account/get-list",

		MASTER_SETTING_DEPARTMENT_GET_LIST_PATH: "/v1/master/setting/department/get-list",
		MASTER_SETTING_DEPARTMENT_GET_BY_OID_PATH: "/master/v1/setting/department/get-by-oid",
		MASTER_SETTING_DEPARTMENT_SAVE_UPDATE_PATH: "/v1/master/setting/department/save-update",
		MASTER_SETTING_DEPARTMENT_DELETE_PATH: "/v1/master/setting/department/delete",

		MASTER_SETTING_DESIGNATION_GET_LIST_PATH: "/v1/master/setting/designation/get-list",
		MASTER_SETTING_DESIGNATION_GET_BY_OID_PATH: "/v1/master/setting/designation/get-by-oid",
		MASTER_SETTING_DESIGNATION_SAVE_UPDATE_PATH: "/v1/master/setting/designation/save-update",
		MASTER_SETTING_DESIGNATION_UPDATE_PATH: "/v1/master/setting/designation/update",
		MASTER_SETTING_DESIGNATION_DELETE_PATH: "/v1/master/setting/designation/delete",

		MASTER_BANK_ACCOUNT_GET_LIST_PATH: "/v1/master/bank-account/get-list",
		MASTER_BANK_ACCOUNT_GET_BY_OID_PATH: "/v1/master/bank-account/get-by-oid",
		MASTER_BANK_ACCOUNT_SAVE_UPDATE_PATH: "/v1/master/bank-account/save-update",
		MASTER_BANK_ACCOUNT_UPDATE_PATH: "/v1/master/bank-account/update",
		MASTER_BANK_ACCOUNT_DELETE_PATH: "/v1/master/bank-account/delete",

		MASTER_PEOPLE_GET_LIST_PATH: "/v1/master/people/get-list",
		MASTER_PEOPLE_GET_BY_OID_PATH: "/v1/master/people/get-by-oid",
		MASTER_PEOPLE_SAVE_PATH: "/v1/master/people/save",
		MASTER_PEOPLE_UPDATE_PATH: "/v1/master/people/update",
		MASTER_PEOPLE_DELETE_PATH: "/v1/master/people/delete",

		MASTER_PASSPORT_GET_LIST_PATH: "/v1/master/passport/get-list",
		MASTER_PASSPORT_GET_BY_OID_PATH: "/v1/master/passport/get-by-oid",
		MASTER_PASSPORT_SAVE_PATH: "/v1/master/passport/save",
		MASTER_PASSPORT_UPDATE_PATH: "/v1/master/passport/update",
		MASTER_PASSPORT_DELETE_PATH: "/v1/master/passport/delete",

		ACCOUNTING_LEDGER_GET_LIST_PATH: "/v1/accounting/ledger/get-list",
		ACCOUNTING_LEDGER_GET_BY_OID_PATH: "/v1/accounting/ledger/get-by-oid",
		ACCOUNTING_LEDGER_SAVE_UPDATE_PATH: "/v1/accounting/ledger/save-update",

		ACCOUNTING_SUBLEDGER_SAVE_UPDATE_PATH: "/v1/accounting/subledger/save-update",

		ACCOUNTING_LEDGER_GROUP_GET_LIST_PATH: "/v1/accounting/ledger-group/get-list",
		ACCOUNTING_LEDGER_GROUP_GET_BY_OID_PATH: "/v1/accounting/ledger-group/get-by-oid",
		ACCOUNTING_LEDGER_GROUP_SAVE_UPDATE_PATH: "/v1/accounting/ledger-group/save-update",

		ACCOUNTING_LEDGER_SETTING_GET_LIST_PATH: "/v1/accounting/ledger-setting/get-list",
		ACCOUNTING_LEDGER_SETTING_GET_BY_OID_PATH: "/v1/accounting/ledger-setting/get-by-oid",
		ACCOUNTING_LEDGER_SETTING_SAVE_UPDATE_PATH: "/v1/accounting/ledger-setting/save-update",

		ACCOUNTING_LEDGER_SUBGROUP_GET_LIST_PATH: "/v1/accounting/ledger-subgroup/get-list",
		ACCOUNTING_LEDGER_SUBGROUP_GET_BY_OID_PATH: "/v1/accounting/ledger-subgroup/get-by-oid",
		ACCOUNTING_LEDGER_SUBGROUP_SAVE_UPDATE_PATH: "/v1/accounting/ledger-subgroup/save-update",

		ACCOUNTING_CHART_OF_ACCOUNT_GET_LIST_PATH: "/v1/accounting/chart-of-account/get-list",
		ACCOUNTING_CHART_OF_ACCOUNT_GET_BY_OID_PATH: "/v1/accounting/chart-of-account/get-by-oid",
		ACCOUNTING_CHART_OF_ACCOUNT_SAVE_UPDATE_PATH: "/v1/accounting/chart-of-account/save-update",

		ACCOUNTING_LEDGER_SUBGROUP_BY_GROUP_GET_LIST_PATH: "/v1/accounting/ledger-subgroup-by-group/get-list",
		ACCOUNTING_LEDGER_BY_SUBGROUP_GET_LIST_PATH: "/v1/accounting/ledger-by-subgroup/get-list",
		ACCOUNTING_LEDGER_GROUP_FOR_DROP_DOWN_GET_LIST_PATH: "/v1/accounting/ledger-group-for-dropdown/get-list",

		ACCOUNTING_MANUAL_JOURNAL_GET_LIST_PATH: "/v1/accounting/manual-journal/get-list",
		ACCOUNTING_MANUAL_JOURNAL_GET_BY_OID_PATH: "/v1/accounting/manual-journal/get-by-oid",
		ACCOUNTING_MANUAL_JOURNAL_SAVE_UPDATE_PATH: "/v1/accounting/manual-journal/save-update",


		CHANGE_PASSWORD: "/v1/user/change-password",
		GET_COMPANY_LIST: "/v1/company/get-list",
		GET_DESIGNATION_LIST: "/v1/designation/get-list",
		ADD_PEOPLE: "/v1/people/add-people",
		UPDATE_PEOPLE: "/v1/people/update-people",
		GET_PEOPLE_LIST: "/v1/people/get-list",
		GET_PEOPLE_BY_OID: "/v1/people/get-by-oid",
		GET_EXPENSE_LEDGER_LIST: "/v1/expense/get-ledger-list",
		ADD_BANK: "/v1/bank/add-bank",
		UPDATE_BANK: "/v1/bank/update-bank",
		GET_BANK_LIST: "/v1/bank/get-list",
		GET_BANK_BY_OID: "/v1/bank/get-by-oid",
		ADD_EXPENSE: "/v1/expense/save-or-update",
		APPROVE_OR_REJECT_EXPENSE: "/v1/expense/approve-or-reject",
		GET_EXPENSE_LIST: "/v1/expense/get-list",
		GET_EXPENSE_BY_OID: "/v1/expense/get-by-oid",
		ADD_DESIGNATION: "/v1/designation/add-designation",
		DOWNLOAD_DOCUMENT: "/v1/download-file",
		UPLOAD_DOCUMENT: "/v1/upload-file",
		ADD_CASH_BOOK: "/v1/cash-book/add-cash-book",
		GET_CASH_BOOK_LIST: "/v1/cash-book/get-list",
		GET_CASH_BOOK_BY_OID: "/v1/cash-book/get-by-oid",
		APPROVE_OR_REJECT_CASH_BOOK: "/v1/cash-book/approve-or-reject",
		ADD_BANK_TRANSACTION: "/v1/bank-transaction/save-or-update",
		GET_BANK_TRANSACTION_BY_OID: "/v1/bank-transaction/get-by-oid",
		GET_BANK_TRANSACTION_LIST: "/v1/bank-transaction/get-list",
		APPROVE_OR_REJECT_BANK_TRANSACTION: "/v1/bank-transaction/approve-or-reject",
		GET_LEDGER_LIST: "/v1/get-ledger-list",
		GET_LEDGER_BALANCE: "/v1/get-ledger-balance",
		GET_SUB_LEDGER_BALANCE: "/v1/get-sub-ledger-balance",

		INVENTORY_WAREHOUSE_SAVE_UPDATE_PATH: "/v1/inventory/warehouse/save-update",
		INVENTORY_WAREHOUSE_CHANGE_DEFAULT_PATH: "/v1/inventory/warehouse/change-default",
		INVENTORY_WAREHOUSE_GET_LIST_PATH: "/v1/inventory/warehouse/get-list",
		INVENTORY_PRODUCT_UNIT_SAVE_UPDATE_PATH: "/v1/inventory/product-unit/save-update",
		INVENTORY_PRODUCT_UNIT_GET_LIST_PATH: "/v1/inventory/product-unit/get-list",
		INVENTORY_PRODUCT_CATEGORY_GET_LIST_PATH: "/v1/inventory/product-category/get-list",
		INVENTORY_PRODUCT_CATEGORY_SAVE_UPDATE_PATH: "/v1/inventory/product-category/save-update",
		INVENTORY_PRODUCT_GET_LIST_PATH: "/v1/inventory/product/get-list",
		INVENTORY_PRODUCT_GET_BY_OID_PATH: "/v1/inventory/product/get-by-oid",
		INVENTORY_PRODUCT_SAVE_UPDATE_PATH: "/v1/inventory/product/save-update",

		GET_PRODUCT_UNIT_LIST: "/v1/product-unit/get-list",
		ADD_PRODUCT_UNIT: "/v1/product-unit/add-product-unit",
		UPDATE_PRODUCT_UNIT: "/v1/product-unit/update-product-unit",
		GET_PRODUCT_UNIT_BY_OID: "/v1/product-unit/get-by-oid",
		GET_PRODUCT_CATEGORY_LIST: "/v1/product-category/get-list",
		ADD_PRODUCT_CATEGORY: "/v1/product-category/add-product-category",
		UPDATE_PRODUCT_CATEGORY: "/v1/product-category/update-product-category",
		GET_PRODUCT_CATEGORY_BY_OID: "/v1/product-category/get-by-oid",
		GET_PRODUCT_LIST: "/v1/product/get-list",
		ADD_PRODUCT: "/v1/product/add-product",
		UPDATE_PRODUCT: "/v1/product/update-product",
		GET_PRODUCT_BY_OID: "/v1/product/get-by-oid",
		GET_LEDGER_SUB_GROUP_BY_OID: "/v1/get-ledger-sub-group-by-oid",

		GET_LEDGER_SUBGROUP: "/v1/get-ledger-subgroup",
		GET_LEDGER_GROUP: "/v1/get-ledger-group",
		GET_LEDGER: "/v1/get-ledger",
		GET_LEDGER_SETTING: "/v1/get-ledger-setting",
		UPDATE_LEDGER_SETTING: "/v1/update-ledger-setting",
		ADD_LEDGER_SUBGROUP: "/v1/add-ledger-subgroup",

		SAVE_UPDATE_PAYMENT_MADE: "/v1/payment-made/save-or-update",
		APPROVE_OR_REJECT_PAYMENT_MADE: "/v1/payment-made/approve-or-reject",
		GET_PAYMENT_MADE_BY_OID: "/v1/payment-made/get-by-oid",
		GET_PAYMENT_MADE_LIST: "/v1/payment-made/get-list",

		SAVE_UPDATE_CREDIT_NOTE: "/v1/credit-note/save-or-update",
		APPROVE_OR_REJECT_CREDIT_NOTE: "/v1/credit-note/approve-or-reject",
		GET_CREDIT_NOTE_BY_OID: "/v1/credit-note/get-by-oid",
		GET_CREDIT_NOTE_LIST: "/v1/credit-note/get-list",

		SAVE_UPDATE_CREDIT_NOTE_REFUND: "/v1/credit-note-refund/save-or-update",
		APPROVE_OR_REJECT_CREDIT_NOTE_REFUND: "/v1/credit-note-refund/approve-or-reject",
		GET_CREDIT_NOTE_REFUND_BY_OID: "/v1/credit-note-refund/get-by-oid",
		GET_CREDIT_NOTE_REFUND_LIST: "/v1/credit-note-refund/get-list",

		SAVE_UPDATE_VENDOR_CREDIT: "/v1/vendor-credit/save-or-update",
		APPROVE_OR_REJECT_VENDOR_CREDIT: "/v1/vendor-credit/approve-or-reject",
		GET_VENDOR_CREDIT_BY_OID: "/v1/vendor-credit/get-by-oid",
		GET_VENDOR_CREDIT_LIST: "/v1/vendor-credit/get-list",

		SAVE_UPDATE_VENDOR_CREDIT_REFUND: "/v1/vendor-credit-refund/save-or-update",
		APPROVE_OR_REJECT_VENDOR_CREDIT_REFUND: "/v1/vendor-credit-refund/approve-or-reject",
		GET_VENDOR_CREDIT_REFUND_BY_OID: "/v1/vendor-credit-refund/get-by-oid",
		GET_VENDOR_CREDIT_REFUND_LIST: "/v1/vendor-credit-refund/get-list",

		SAVE_UPDATE_PAYMENT_RECEIVED: "/v1/payment-received/save-or-update",
		APPROVE_OR_REJECT_PAYMENT_RECEIVED: "/v1/payment-received/approve-or-reject",
		GET_PAYMENT_RECEIVED_BY_OID: "/v1/payment-received/get-by-oid",
		GET_PAYMENT_RECEIVED_LIST: "/v1/payment-received/get-list",
		GET_CHART_OF_ACCOUNT: "/v1/accounting/get-chart-of-account",
		GET_JOURNAL_LIST: "/v1/accounting/get-journal-list",
		SAVE_JOURNAL: "/v1/accounting/add-journal",
		GET_FINANCIAL_PERIOD_LIST: "/v1/accounting/get-financial-period-list",
		ADD_FINANCIAL_PERIOD: "/v1/accounting/financial-period",



		GET_ACTIVITY_LOG_LIST: "/v1/activity-log/get-list",



	},

};
