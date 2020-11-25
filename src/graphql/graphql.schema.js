const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    user_id: ID!
    has_user_state: [User_State] @relation(name: "HAS_USER_STATE", direction: "OUT")
    user_to_customer: [Customer] @relation(name: "USER_TO_CUSTOMER", direction: "OUT")
  }

  type User_State {
    user_pref_NL_AT: Boolean
    user_email: String
    user_title_post: String
    user_pref_NL_EU: Boolean
    user_last_name: String
    user_pwd: String
    user_gdpr_accepted: Int
    user_sex: String
    user_first_name: String
    user_pref_NL_CH: Boolean
    user_id: Int
    user_title_pre: String
    user_pref_NL_DE: Boolean
    user_acronym: String
    user_middle_name: String
    user_pref_country: Int
    user_rmk: String
    user: [User]
  }

  type Customer {
    cust_id: ID!
    cust_status: Int
    cust_rmk: String
    user: User
    customer_state: [Customer_State]
  }

  type Log_Type {
    log_type_desc: String
    log_type_id: Int
  }

  type Country {
    country_name_de: String
    iso_3166_1_alpha_2: String
    avail_for_nl: Boolean
    iso_3166_1_alpha_3: String
    country_id: Int
    avail_for_nl_ord: Int
    country_name_en: String
  }

  type SysAdmin {
    user_id: Int
  }

  type Author {
    user_id: Int
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
  }

  type Country_Sub {
    iso_3166_2: String
    country_sub_name_de: String
    country_sub_name_en: String
    country_id: Int
    country_sub_id: Int
  }

  type Currency {
    currency_de: String
    currency_en: String
    currency_ord_cust: Int
    iso_4217: String
    currency_id: Int
  }

  type Log {
    log_par_02: String
    log_par_01: String
    log_timestamp: Int
  }

  type Customer_State {
    cust_contact_user: Int
    cust_single: Boolean
    cust_vat_perc: Float
    cust_alt_inv_dept: String
    cust_no_invoice: Boolean
    cust_alt_inv_cost_center: String
    cust_street_no: String
    cust_alt_inv_order_no: String
    cust_cost_center: String
    cust_alt_inv_name_01: String
    cust_acc_until: _Neo4jDate
    cust_share_klein: Float
    cust_alt_inv_name_02: String
    cust_alt_inv_name_03: String
    cust_alt_inv_street_no: String
    cust_dept: String
    cust_alt_inv_contact_user: String
    cust_status: Int
    cust_alt_inv_email: String
    cust_disc_perc: Float
    cust_paid_until: _Neo4jDate
    cust_name_03: String
    cust_name_02: String
    cust_name_01: String
    cust_rate: Float
    cust_gtc_accepted: Int
    cust_order_no: String
    cust_alt_inv_city: String
    cust_contact_user_salut: String
    cust_zip: Int
    cust_alt_inv_zip: String
    cust_country: Int
    cust_alt_inv_salut: String
    cust_id: Int
    cust_vat_id: String
    cust_rmk: String
    cust_city: String
    customer: Customer
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
    inv_cancelled: Boolean
    inv_name_03: String
    inv_name_02: String
    inv_no_of_months: Int
    inv_date: _Neo4jDate
    inv_currency: String
    inv_date_start: _Neo4jDate
    inv_city: String
    inv_cost_center: String
    inv_name_01: String
  }

  type Mutation {
    login(email: String!, password: String!): User_State
  }
`;

module.exports = typeDefs;
