const { gql } = require("apollo-server-express");

const typeDefs = gql`
  directive @isAuthenticated on OBJECT | FIELD_DEFINITION
  directive @isAdmin on OBJECT | FIELD_DEFINITION

  type User {
    user_email: String
    user_is_author: Boolean
    user_status: String
    user_is_sys_admin: Boolean
    has_user_state: [User_State]
      @relation(name: "HAS_USER_STATE", direction: OUT)
    user_to_customer: [Customer]
      @relation(name: "USER_TO_CUSTOMER", direction: OUT)
    log_for_user: [Log] @relation(name: "LOG_FOR_USER", direction: IN)
  }

  type User_State {
    user_id: Int
    user_first_name: String
    user_middle_name: String
    user_last_name: String
    user_pwd: String
    user_gdpr_accepted: Float
    user_title_post: String
    user_sex: String
    user_pref_NL_AT: Boolean
    user_pref_NL_CH: Boolean
    user_pref_NL_DE: Boolean
    user_pref_NL_EU: Boolean
    user_title_pre: String
    user_acronym: String
    user_pref_country: Int
    user_rmk: String
    nl_email_unsubscribed: Boolean
    user: User @relation(name: "HAS_USER_STATE", direction: IN)
    user_has_pref_surf_lang: Language
      @relation(name: "USER_HAS_PREF_SURF_LANG", direction: OUT)
    user_has_pref_1st_lang: Language
      @relation(name: "USER_HAS_PREF_1ST_LANG", direction: OUT)
    user_has_pref_2nd_lang: Language
      @relation(name: "USER_HAS_PREF_2ND_LANG", direction: OUT)
    user_has_pref_country: Country
      @relation(name: "USER_HAS_PREF_COUNTRY", direction: OUT)
  }

  type Customer {
    cust_id: ID!
    cust_status: Int
    cust_rmk: String
    user: User
    inv_for_cust: Invoice @relation(name: "INV_FOR_CUST", direction: IN)
    has_cust_state: [Customer_State]
      @relation(name: "HAS_CUST_STATE", direction: IN)
    user_to_customer_user: User
      @relation(name: "USER_TO_CUSTOMER", direction: IN)
  }

  type Log_Type {
    log_type_desc: String
    log_type_id: Int
  }

  type Country {
    country_name_de: String
    iso_3166_1_alpha_2: String
    avail_for_nl: Boolean
    avail_for_inv: Boolean
    iso_3166_1_alpha_3: String
    country_id: Int
    avail_for_nl_ord: Int
    avail_for_inv_ord: Int
    country_name_en: String
    is_sub_country_of: [Country_Sub]
      @relation(name: "IS_SUB_COUNTRY_OF", direction: IN)
    inv_sent_from: Invoice @relation(name: "INV_SENT_FROM", direction: IN)
  }

  type Language {
    lang_de: String
    lang_display_ord_users: String
    lang_id: Int
    lang_display_ord_lit: String
    iso_639_1: String
    lang_endonym: String
    lang_en: String
    iso_639_3: String
    lang_avail_for_inv: Boolean
  }

  type Country_Sub {
    iso_3166_2: String
    country_sub_name_de: String
    country_sub_name_en: String
    country_id: Int
    country_sub_id: Int
    is_sub_country_of: Country
      @relation(name: "IS_SUB_COUNTRY_OF", direction: OUT)
  }

  type Currency {
    currency_de: String
    currency_en: String
    currency_ord_cust: Int
    iso_4217: String
    currency_id: Int
    curr_avail_for_inv: Boolean
    to_be_invoiced_in_currency: Customer_State
      @relation(name: "TO_BE_INVOICED_IN_CURRENCY", direction: IN)
  }

  type Log {
    log_par_02: String
    log_par_01: String
    log_timestamp: Int
    log_for_user: User @relation(name: "LOG_FOR_USER", direction: OUT)
  }

  type Customer_State {
    cust_contact_user: String
    cust_inv_spec_email: String
    cust_single: Boolean
    cust_vat_perc: Float
    cust_alt_inv_dept: String
    cust_no_invoice: Boolean
    cust_alt_inv_cost_center: String
    cust_street_no: String
    cust_alt_inv_order_no: String
    cust_cost_center: String
    cust_alt_inv_name_01: String
    cust_acc_until: String
    cust_share_klein: Float
    cust_alt_inv_name_02: String
    cust_alt_inv_name_03: String
    cust_alt_inv_street_no: String
    cust_alt_inv_vat_id: String
    cust_dept: String
    cust_alt_inv_contact_user: String
    cust_status: Int
    cust_alt_inv_email: String
    cust_disc_perc: Float
    cust_paid_until: String
    cust_name_03: String
    cust_name_02: String
    cust_name_01: String
    cust_rate: Float
    cust_gtc_accepted: Float
    cust_order_no: String
    cust_alt_inv_city: String
    cust_contact_user_salut: String
    cust_zip: String
    cust_alt_inv_zip: String
    cust_country: Int
    cust_alt_inv_salut: String
    cust_id: Int
    cust_vat_id: String
    cust_rmk: String
    cust_city: String
    inv_goes_to_alt_rec: Boolean
    inv_in_lang: Invoice @relation(name: "INV_IN_LANG", direction: OUT)
    inv_to_alt_country: Country
      @relation(name: "INV_TO_ALT_COUNTRY", direction: OUT)
    is_located_in_country: Country
      @relation(name: "IS_LOCATED_IN_COUNTRY", direction: OUT)
    has_cust_state: Customer @relation(name: "HAS_CUST_STATE", direction: OUT)
    to_be_invoiced_in_currency: Currency
      @relation(name: "TO_BE_INVOICED_IN_CURRENCY", direction: OUT)
  }

  type Invoice {
    inv_vat_perc: Float
    inv_country: String
    inv_street_no: String
    inv_paid: _Neo4jDate
    inv_order_no: String
    inv_cust_salut: String
    inv_vat: Float
    inv_rate_per_month_net: Float
    inv_rate_per_month: Float
    inv_vat_id: String
    inv_id_strg: String
    inv_amount_net: Float
    inv_date_end: _Neo4jDate
    inv_id: Int
    inv_zip: String
    inv_dept: String
    inv_email: String
    inv_amount_total: Float
    inv_disc_perc: Float
    inv_disc_net: Float
    inv_cancelled: _Neo4jDate
    inv_name_03: String
    inv_name_02: String
    inv_no_of_months: Int
    inv_date: _Neo4jDate
    inv_currency: String
    inv_date_start: _Neo4jDate
    inv_city: String
    inv_cost_center: String
    inv_name_01: String
    inv_cust_ref: String
    inv_sent_from: Country @relation(name: "INV_SENT_FROM", direction: OUT)
    customer: Customer @relation(name: "INV_FOR_CUST", direction: OUT)
  }

  type loginCustomerStatesCustom {
    user_is_cust_admin: Boolean
    cust_gtc_accepted: String
    cust_id: ID
    cust_acc_until: String
    user_to: Float
    single_user: Boolean
    cust_spec_cont: Boolean
  }

  type userAddresses {
    user_address_en: String
    user_address_de: String
  }

  type NL {
    nl_active: Boolean
    nl_implemented: Boolean
    nl_author: String
    nl_date: _Neo4jDate
    nl_id: ID
    nl_no: String
    nl_ord: String
    nl_state: NL_State @relation(name: "HAS_NL_STATE", direction: OUT)
    user: User @relation(name: "NL_HAS_AUTHOR", direction: OUT)
    country: Country @relation(name: "NL_REFERS_TO_COUNTRY", direction: OUT)
  }

  type NL_State {
    nl_text: String
    nl_title_long: String
    nl_title_short: String
    nl_language: Language @relation(name: "NL_LANG_IS", direction: OUT)
  }

  type UserCustom {
    user_id: ID
    user_first_name: String
    user_middle_name: String
    user_last_name: String
    user_email: String
    user_surf_lang: String
    user_2nd_lang: String
    user_1st_lang: String
    user_pwd: String
    user_pref_country: String
    user_gdpr_accepted: Float
    cust_states: [loginCustomerStatesCustom]
    user_addresses: [userAddresses]
    user_NL_state: [String]
    user_last_login: String
    user_login_count: Int
    user_is_author: Boolean
    user_is_sys_admin: Boolean
  }

  type UserCustomLogin {
    user: UserCustom
    token: String
    lang: String
    loginStatus: Boolean
    loginMessage: String
    loginFailedCode: String
  }

  type CustomersCustom {
    customers: [Customer_State]
    total: Int
  }
  type InvoiceCustom {
    invoices: [Invoice]
    total: Int
  }
  type UserCustomersList {
    cust_name_01: String!
    cust_id: Int!
  }
  type CustomerCustom {
    customer: Customer
    customer_state: Customer_State
    cust_to_be_invoiced_from_country_en: String
    cust_to_be_invoiced_from_country_de: String
    cust_to_be_invoiced_from_country_id: Int
    cust_country_de: String
    cust_country_en: String
    cust_inv_currency: String
    cust_inv_lang_de: String
    cust_inv_lang_en: String
    cust_alt_inv_country_de: String
    cust_alt_inv_country_en: String
    cust_inv_currency_id: Int
    country_id: Int
    cust_inv_lang_id: Int
    cust_alt_inv_country_id: Int
  }

  input Customer_StateInput {
    cust_contact_user: String
    cust_inv_spec_email: String
    cust_single: Boolean
    cust_vat_perc: Float
    cust_alt_inv_dept: String
    cust_no_invoice: Boolean
    cust_alt_inv_cost_center: String
    cust_street_no: String
    cust_alt_inv_order_no: String
    cust_cost_center: String
    cust_alt_inv_name_01: String
    cust_acc_until: String
    cust_share_klein: Float
    cust_alt_inv_name_02: String
    cust_alt_inv_name_03: String
    cust_alt_inv_vat_id: String
    cust_alt_inv_street_no: String
    cust_dept: String
    cust_alt_inv_contact_user: String
    cust_status: Int
    cust_alt_inv_email: String
    cust_disc_perc: Float
    cust_paid_until: String
    cust_name_03: String
    cust_name_02: String
    cust_name_01: String
    cust_rate: Float
    cust_gtc_accepted: Float
    cust_order_no: String
    cust_alt_inv_city: String
    cust_contact_user_salut: String
    cust_zip: String
    cust_alt_inv_zip: String
    cust_country: Int
    cust_alt_inv_salut: String
    cust_id: Int
    cust_vat_id: String
    cust_rmk: String
    cust_city: String
    inv_goes_to_alt_rec: Boolean
  }

  input CustomerInput {
    cust_status: Int
    cust_id: Int
    cust_rmk: String
  }

  input CustomerCustomInput {
    customer: CustomerInput
    customer_state: Customer_StateInput
    cust_to_be_invoiced_from_country_de: String
    cust_to_be_invoiced_from_country_en: String
    cust_to_be_invoiced_from_country_id: Int
    cust_country_de: String
    cust_country_en: String
    cust_inv_currency: String
    cust_inv_lang_de: String
    cust_inv_lang_en: String
    cust_alt_inv_country_de: String
    cust_alt_inv_country_en: String
    cust_inv_currency_id: Int!
    country_id: Int!
    cust_inv_lang_id: Int!
    cust_alt_inv_country_id: Int
  }

  input UserInput {
    user_email: String
  }

  input User_StateInput {
    user_id: Int
    user_first_name: String
    user_middle_name: String
    user_last_name: String
    user_pwd: String
    user_gdpr_accepted: Float
    user_title_post: String
    user_sex: String
    user_title_pre: String
    user_acronym: String
    user_pref_country: Int
    user_rmk: String
    user_last_login: String
    user_login_count: Int
    nl_email_unsubscribed: Boolean
  }
  enum NL_Country {
    EU
    AT
    DE
    CH
  }
  enum LanguageForUser {
    de
    en
  }

  enum Pref_Country {
    AT
    DE
    CH
  }

  input UserCustomInput {
    user: UserInput
    user_state: User_StateInput
    user_pref_surf_lang_iso_639_1: LanguageForUser
    user_pref_1st_lang_iso_639_1: LanguageForUser
    user_pref_2nd_lang_iso_639_1: LanguageForUser
    user_pref_country_iso_3166_1_alpha_2: Pref_Country
    user_want_nl_from_country_iso_3166_1_alpha_2: [NL_Country]
    user_acronym: String
    user_is_sys_admin: Boolean
    user_is_author: Boolean
    user_pwd_old: String
  }

  type InvoiceCustomersCustom {
    invoiceCustomer: [Invoice]
    total: Int
  }
  type UserToCustomer {
    from: Float
    to: Float
    cust_spec_cont: Boolean
    user_funct_at_cust: String
    user_is_cust_admin: Boolean
    user_spec_cont: Boolean
  }
  type UserCustomer {
    customer: Customer
    user: User
    user_state: User_State
    user_to_customer: UserToCustomer
  }
  type UserStateCustom {
    user_id: Int
    user_first_name: String
    user_middle_name: String
    user_last_name: String
    user_pwd: String
    user_gdpr_accepted: Float
    user_title_post: String
    user_sex: String
    user_pref_NL_AT: Boolean
    user_pref_NL_CH: Boolean
    user_pref_NL_DE: Boolean
    user_pref_NL_EU: Boolean
    user_title_pre: String
    user_acronym: String
    user_pref_country: Int
    user_rmk: String
    user_last_login: String
    user_login_count: Int
    nl_email_unsubscribed: Boolean
  }
  type CustomUser {
    user: User
    user_state: UserStateCustom
    lang1: Language
    lang2: Language
    lang3: Language
    cou1: Country
    cou3: [Country]
    ui: User
  }

  type UsersByCustomer {
    users: [UserCustomer]
    total: Int
  }
  type CustomNLList {
    nls: [NL]
    total: Int
  }

  input UserStateCustomInput {
    user_first_name: String!
    user_middle_name: String
    user_last_name: String
    user_pwd: String
    user_gdpr_accepted: Boolean
    user_title_post: String
    user_sex: String!
    user_title_pre: String
  }

  input NLStateENInput {
    nl_text: String
    nl_title_long: String
    nl_title_short: String
  }
  input NLStateDEInput {
    nl_text: String
    nl_title_long: String
    nl_title_short: String
  }

  input CustomNLStateInput {
    de: NLStateDEInput
    en: NLStateENInput
  }
  input CustomNLInput {
    nl_id: ID
    nl_active: Boolean
    nl_implemented: Boolean
    nl_date: _Neo4jDate!
    nl_ord: String!
  }

  input nlCountry {
    iso_3166_1_alpha_2: NL_Country!
  }

  input CustomCreateNLInput {
    nl: CustomNLInput!
    nls: CustomNLStateInput
    country: nlCountry
  }

  type NLStateEN {
    nl_text: String
    nl_title_long: String
    nl_title_short: String
  }
  type NLStateDE {
    nl_text: String
    nl_title_long: String
    nl_title_short: String
  }
  type CustomNLState {
    de: NLStateDE
    en: NLStateEN
  }

  type CustomNL {
    nl_id: ID
    nl_active: Boolean
    nl_implemented: Boolean
    nl_date: _Neo4jDate
    nl_ord: String
  }

  type GetCustomNL {
    nl: CustomNL
    nls: CustomNLState
    user: User
    country: Country
  }

  enum Subscription_Plan {
    SINGLE
    MULTIPLE
    UNLIMITED
  }

  input registerCustomer {
    user: UserInput!
    user_state: UserStateCustomInput!
    customer: CustomerInput
    customer_state: Customer_StateInput!
    cust_country_iso_3166_1_alpha_2: String!
    cust_inv_lang_iso_639_1: String!
    cust_inv_currency_iso_4217: String!
    cust_alt_inv_country_iso_3166_1_alpha_2: String
    subscriptionPlan: Subscription_Plan!
  }
  enum GENDER {
    f
    m
  }
  input InvitationInput {
    cust_id: Int!
    new_user_first_name: String!
    new_user_last_name: String!
    new_user_sex: GENDER!
    new_user_email: String!
  }

  type Invitation {
    status: Boolean
    statusCode: String
    message: String
  }

  type Mutation {
    register(data: registerCustomer!): Boolean
    login(user_email: String!, user_pwd: String!): UserCustomLogin
    acceptGTC(accept: Boolean!): UserCustomLogin @isAuthenticated
    acceptGDPR(accept: Boolean!): UserCustomLogin @isAuthenticated
    encryptPassword(limit: Int): Boolean @isAdmin
    forgotPassword(user_email: String!): Boolean
    setNewPassword(user_pwd: String, token: String!): Boolean
    createCustomer(customer_id: Int!, data: CustomerCustomInput!): Boolean
      @isAuthenticated
    newCustomer(data: CustomerCustomInput!): Boolean @isAuthenticated
    invoicePaid(invoice_id: String!): Boolean @isAdmin
    createInvoice(customer_id: Int!): Boolean @isAdmin
    setUserProperties(
      user_email: String!
      entitled: Boolean
      admin: Boolean
      specCount: Boolean
    ): Boolean @isAuthenticated
    createUser(user_email: String!, data: UserCustomInput!): Boolean
      @isAuthenticated
    newUser(data: UserCustomInput!): Boolean @isAdmin
    invite(data: InvitationInput!): Invitation @isAuthenticated
    invitedUserCreate(token: String!, data: UserCustomInput!): Boolean
    addUserInCustomer(user_email: String!, customer_id: Int!): Boolean @isAdmin
    invoiceCancel(invoice_id: String!): Boolean @isAdmin
    deleteNewsletter(nl_id: String!): Boolean @isAdmin
    resendEmailVerify(user_email: String!): Boolean
    createNewsletter(data: CustomCreateNLInput!): Boolean @isAdmin
    updateNewsletter(nl_id: Int!, data: CustomCreateNLInput!): Boolean @isAdmin
    unsubscribeNewsletter(token: String!): Boolean
  }
  type Query {
    user: User_State @isAuthenticated
    getUserCustomerList: [UserCustomersList] @isAuthenticated
    getConnectUserList: [User] @isAuthenticated
    getUsersNotConnectedByCustomer: [User] @isAuthenticated
    getUsersByCustomer(
      customerId: Int!
      first: Int
      offset: Int
      orderBy: [_UserOrdering]
      filter: _UserFilter
      orderByUserState: [_User_StateOrdering]
      filterByString: String
    ): UsersByCustomer @isAuthenticated
    getUsers(
      first: Int
      offset: Int
      orderBy: [_UserOrdering]
      filter: _UserFilter
      orderByUserState: [_User_StateOrdering]
      filterByUserState: _User_StateFilter
      filterByString: String
    ): UsersByCustomer @isAuthenticated
    getUser(user_email: String!): CustomUser @isAuthenticated
    User(
      user_email: String
      user_is_author: Boolean
      user_is_sys_admin: Boolean
      first: Int
      offset: Int
      orderBy: [_UserOrdering]
      filter: _UserFilter
    ): [User] @isAdmin
    getInvoices(
      customer_id: Int!
      first: Int
      offset: Int
      orderByInvoice: [_InvoiceOrdering]
    ): InvoiceCustom @isAuthenticated
    getInvoice(customer_id: Int, invoice_id: String!): Invoice @isAuthenticated
    verifyForgotPasswordLink(token: String!): Boolean
    getNewsLettersOnLanding(country: [String!], lang: LanguageForUser!): [NL!]
    getNewsLetterDetails(nl_id: Int!): NL @isAuthenticated
    getNewsLetter(nl_id: Int!): GetCustomNL @isAdmin
    getNewsLetterList(
      filterByString: String
      lang: LanguageForUser!
      first: Int
      offset: Int
      orderBy: [_NLOrdering]
      filterByCountry: [_CountryFilter]
    ): CustomNLList @isAdmin
    getCustomers(
      first: Int
      offset: Int
      orderByCountry: [_CountryOrdering]
      filterCountry: [_CountryFilter]
      orderBy: [_Customer_StateOrdering]
      filterByCustomer: _Customer_StateFilter
    ): CustomersCustom @isAdmin
    getInvoiceCustomers(
      first: Int
      offset: Int
      orderByInvoice: [_InvoiceOrdering]
      filterInvoice: [_InvoiceFilter]
      orderBy: [_Customer_StateOrdering]
      filterByString: String
    ): InvoiceCustomersCustom @isAdmin
    getCustomer(customer_id: Int!): CustomerCustom @isAuthenticated
    getPreparedNewInvoiceDetails(customer_id: Int!): Invoice @isAuthenticated
    downloadInvoice(invoice_id: String!): String @isAuthenticated
    userEmailExists(user_email: String!): Boolean @isAuthenticated
    verifyInvitation(token: String!): CustomUser
    verifyEmail(token: String!): Boolean
  }
`;

module.exports = typeDefs;
