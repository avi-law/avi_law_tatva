// -(u:User {user_email: user_email: $user_email}})
exports.getUserStateInformationQUery = `
MATCH (us:User_State)<-[r1:HAS_USER_STATE]-(u:User {user_email: $user_email })
WHERE r1.to IS NULL
  Call { With u MATCH (u:User)-[r2:USER_TO_CUSTOMER]->(c:Customer)-[r3:HAS_CUST_STATE]->(cs:Customer_State)
    WHERE r3.to IS NULL
    RETURN collect({ cust_id: cs.cust_id, cust_acc_until: toString(cs.cust_acc_until), cust_gtc_accepted: cs.cust_gtc_accepted, user_is_cust_admin: r2.user_is_cust_admin, cust_spec_cont: r2.cust_spec_cont, single_user: cs.cust_single, user_to: r2.to } ) AS cust_states }
  Call { With us MATCH (us:User_State)-[r8:USER_WANTS_NL_FROM_COUNTRY]->(cou:Country)
    WHERE r8.to IS NULL
    RETURN collect(cou.iso_3166_1_alpha_2) AS user_NL_state
  }
  Call { With us RETURN collect({
    user_address_en:
      CASE us.user_sex
        WHEN 'f'
          THEN "Dear Ms. " + COALESCE(us.user_title_pre + " ","") + COALESCE(us.user_last_name,"") + COALESCE(", " + us.user_title_post,"") + "!"
        WHEN 'm'
          THEN "Dear Mr. " + COALESCE(us.user_title_pre + " ","") + COALESCE(us.user_last_name,"") + COALESCE(", " + us.user_title_post,"") + "!"
        END,
    user_address_de:
      CASE us.user_sex
        WHEN 'f'
          THEN "Sehr geehrte Frau " + COALESCE(us.user_title_pre + " ","") + COALESCE(us.user_last_name,"") + COALESCE(", " + us.user_title_post,"") + "!"
        WHEN 'm'
          THEN "Sehr geehrter Herr " + COALESCE(us.user_title_pre + " ","") + COALESCE(us.user_last_name,"") + COALESCE(", " + us.user_title_post,"") + "!"
          END
        })
  AS user_addresses
}
MATCH (us)-[r4:USER_HAS_PREF_SURF_LANG]->(l1:Language)
WHERE r4.to IS NULL
MATCH (us)-[r5:USER_HAS_PREF_1ST_LANG]->(l2:Language)
WHERE r5.to IS NULL
MATCH (us)-[r6:USER_HAS_PREF_2ND_LANG]->(l3:Language)
WHERE r6.to IS NULL
MATCH (us)-[r7:USER_HAS_PREF_COUNTRY]->(cou:Country)
WHERE r7.to IS NULL
RETURN {
  user_id: us.user_id,
  user_email: u.user_email,
  user_first_name: us.user_first_name,
  user_middle_name: us.user_middle_name,
  user_last_name: us.user_last_name,
  user_pwd: us.user_pwd,
  user_gdpr_accepted: us.user_gdpr_accepted,
  user_surf_lang: l1.iso_639_1,
  user_1st_lang: l2.iso_639_1,
  user_2nd_lang: l3.iso_639_1,
  user_pref_country: cou.iso_3166_1_alpha_2,
  cust_states: cust_states,
  user_NL_state: user_NL_state,
  user_addresses: user_addresses,
  user_last_login: us.user_last_login,
  user_login_count: us.user_login_count,
  user_is_author: u.user_is_author,
  user_is_sys_admin: u.user_is_sys_admin
} AS User;`;

exports.loginQuery = `
MATCH (us:User_State)<-[r1:HAS_USER_STATE]-(u:User {user_email: $user_email })
WHERE r1.to IS NULL
RETURN us as userState`;

exports.getUserDetails = `
MATCH (us:User_State)<-[r1:HAS_USER_STATE]-()
WHERE us.user_id = $user_id
RETURN us
LIMIT 1`;

// Get common logging query function
exports.getCommonUserStateLogginQuery = (otherParams = null) => {
  const params = otherParams ? `, ${otherParams}` : "";
  return `MATCH (a: Log_Type { log_type_id: $type })
  MATCH (b:User { user_email: $user_email } )-[HAS_USER_STATE]->(:User_State)
  MERGE (b)<-[:LOG_FOR_USER]-(:Log { log_timestamp: apoc.date.currentTimestamp() ${params} })-[:HAS_LOG_TYPE]->(a);`;
};

exports.manageLoginCountQuery = `
MATCH (us:User_State)<-[r1:HAS_USER_STATE]-(u:User {user_email: $user_email })
SET us.user_login_count = us.user_login_count + 1
SET us.user_last_login = apoc.date.currentTimestamp();`;

exports.logICustomerGTCQuery = `
MATCH (a: Log_Type { log_type_id: $type })
MATCH (c:Customer)<-[USER_TO_CUSTOMER]-(:User {user_email: $user_email})-[HAS_USER_STATE]->(:User_State)
MERGE (c)<-[:LOG_FOR_CUSTOMER]-(:Log{log_timestamp: apoc.date.currentTimestamp()})-[:HAS_LOG_TYPE]->(a);`;

exports.logInvalidEmailQuery = `
MATCH (n:Log_Type { log_type_id: $type } )
MERGE(:Log { log_timestamp: apoc.date.currentTimestamp(), log_par_01: $user_email, log_par_02: $user_pwd })-[:HAS_LOG_TYPE]-> (n);`;

exports.updateGTCAccept = `
MATCH (cs:Customer_State)<-[HAS_CUSTOMER_STATE]-(c:Customer)<-[r:USER_TO_CUSTOMER]-(:User { user_email:$user_email })-[r1:HAS_USER_STATE]->(:User_State)
WHERE r.user_is_cust_admin = true OR cs.cust_single = true AND r1.to IS NULL
SET cs.cust_gtc_accepted = apoc.date.currentTimestamp();`;

exports.updateGDPRAccept = `
MATCH ( us:User_State )<-[r1:HAS_USER_STATE]-(u:User {user_email: $user_email })
WHERE r1.to IS NULL
SET us.user_gdpr_accepted = apoc.date.currentTimestamp();`;

exports.getUserByEmail = `
MATCH (us:User_State)<-[r1:HAS_USER_STATE]-(u:User { user_email: $user_email })
MATCH (us)-[r2:USER_HAS_PREF_SURF_LANG]->(l1:Language)
WHERE r1.to IS NULL
RETURN us as userState, l1.iso_639_1 as user_surf_lang`;

exports.setPasswordToken = `
MATCH ( us:User_State)<-[r1:HAS_USER_STATE]-(u:User {user_email: $user_email })
SET us.reset_pwd_token = $token, us.reset_pwd_token_expiry_date = $resetTokenExpiryDate
RETURN us as userState;`;

exports.getUserByToken = `
MATCH (us:User_State)<-[r1:HAS_USER_STATE]-(u:User)
WHERE us.reset_pwd_token = $token AND r1.to IS NULL
RETURN us as userState, u.user_email as userEmail`;

exports.resetUserPassword = `
MATCH ( us:User_State )<-[r1:HAS_USER_STATE]-(u:User)
WHERE u.user_email = $user_email AND r1.to IS NULL
SET us.user_pwd = $user_pwd
REMOVE us.reset_pwd_token, us.reset_pwd_token_expiry_date
RETURN us as userState;`;

exports.cloneForgotPasswordUserState = `
MATCH (us1:User_State)<-[r1:HAS_USER_STATE]-(u1:User)
WHERE u1.user_email = $user_email AND r1.to IS NULL
CALL apoc.refactor.cloneNodesWithRelationships([us1])
YIELD input, output as us_new
SET r1.to = apoc.date.currentTimestamp()
WITH us_new, us1
MATCH (us_new)<-[r2:HAS_USER_STATE]-(u2:User)
OPTIONAL MATCH (:User_State)<-[r3:HAS_USER_STATE_PRED]-(us_new)
DELETE r3
SET r2.from = apoc.date.currentTimestamp()
MERGE (us_new)-[:HAS_USER_STATE_PRED {from: apoc.date.currentTimestamp()}]->(us1)`;

exports.getNewsletterByLang = `
MATCH (nl:NL_Article)-[:NL_REFERS_TO_COUNTRY]->(cou:Country)
WHERE nl.nl_article_active = true AND cou.iso_3166_1_alpha_2 IN $LANG_ARRAY
RETURN {
  nl_article_id: nl.nl_article_id,
  nl_article_no: nl.nl_article_no,
  nl_article_date: toString(nl.nl_article_date),
  nl_article_active: nl.nl_article_active,
  nl_article_author: nl.nl_article_author,
  nl_article_last_updated: nl.nl_article_last_updated,
  nl_article_order: nl.nl_article_order,
  nl_article_text_de: nl.nl_article_text_de,
  nl_article_text_en: nl.nl_article_text_en,
  nl_article_title_de_long: nl.nl_article_title_de_long,
  nl_article_title_de_short: nl.nl_article_title_de_short,
  nl_article_title_en_long: nl.nl_article_title_en_long,
  nl_article_title_en_short:
  CASE
		WHEN nl.nl_article_title_en_short is null
			THEN nl.nl_article_title_de_short
      ELSE nl.nl_article_title_en_short
    END,
  Country: {
      iso_3166_1_alpha_2: cou.iso_3166_1_alpha_2
    }
} As newLetters
ORDER BY nl.nl_article_order DESC
LIMIT 10;`;

exports.getDefaultNewsletter = `
MATCH (nl:NL_Article)-[:NL_REFERS_TO_COUNTRY]->(cou:Country)
WHERE nl.nl_article_active = true
RETURN {
  nl_article_id: nl.nl_article_id,
  nl_article_no: nl.nl_article_no,
  nl_article_date: toString(nl.nl_article_date),
  nl_article_active: nl.nl_article_active,
  nl_article_author: nl.nl_article_author,
  nl_article_last_updated: nl.nl_article_last_updated,
  nl_article_order: nl.nl_article_order,
  nl_article_text_de: nl.nl_article_text_de,
  nl_article_text_en: nl.nl_article_text_en,
  nl_article_title_de_long: nl.nl_article_title_de_long,
  nl_article_title_de_short: nl.nl_article_title_de_short,
  nl_article_title_en_short:
  CASE
		WHEN nl.nl_article_title_en_short is null
			THEN nl.nl_article_title_de_short
      ELSE nl.nl_article_title_en_short
    END,
  Country: {
      iso_3166_1_alpha_2: cou.iso_3166_1_alpha_2
    }
} As newLetters
ORDER BY nl.nl_article_order DESC
LIMIT 10;`;

exports.getNewsletter = `
MATCH (nl:NL_Article )
WHERE nl.nl_article_id = $nl_article_id
RETURN nl`;

exports.getCustomersCountQuery = (condition = "") => `
MATCH (cs:Customer_State)-[:IS_LOCATED_IN_COUNTRY]->(cou:Country)
MATCH (c:Customer)-[r1:HAS_CUST_STATE]->(cs)
${condition}
RETURN count(*) as count`;
exports.getCustomersQuery = (
  condition = "",
  limit = 10,
  skip = 0,
  orderBy = "cou.iso_3166_1_alpha_2 ASC"
) => `
  MATCH (cs:Customer_State)-[:IS_LOCATED_IN_COUNTRY]->(cou:Country)
  MATCH (c:Customer)-[r1:HAS_CUST_STATE]->(cs)
  ${condition}
  RETURN {
    cust_name_01: cs.cust_name_01,
    cust_id: cs.cust_id,
    cust_status: cs.cust_status,
    is_located_in_country: {
      country_name_de: cou.country_name_de,
      iso_3166_1_alpha_2: cou.iso_3166_1_alpha_2,
      avail_for_nl: cou.avail_for_nl,
      iso_3166_1_alpha_3: cou.iso_3166_1_alpha_3,
      country_id: cou.country_id,
      avail_for_nl_ord: cou.avail_for_nl_ord,
      country_name_en: cou.country_name_en
    }
  } AS customers
  ORDER BY ${orderBy}
  SKIP toInteger(${skip})
  LIMIT toInteger(${limit})`;

exports.getCustomer = `
MATCH (c:Customer)-[r1:HAS_CUST_STATE]->(cs:Customer_State)-[:IS_LOCATED_IN_COUNTRY]->(cou:Country)
WHERE c.cust_id = $customerId and r1.to IS NULL
OPTIONAL MATCH (cs)-[:INV_TO_ALT_COUNTRY]->(cou2:Country)
OPTIONAL MATCH (cs)-[:TO_BE_INVOICED_IN_CURRENCY]->(curr:Currency)
OPTIONAL MATCH (cs)-[:INV_IN_LANG]->(lang:Language)
RETURN {
  customer: {
    cust_id: c.cust_id
  },
  customer_state: {
    cust_contact_user: cs.cust_contact_user,
    cust_single: cs.cust_single,
    cust_vat_perc: cs.cust_vat_perc,
    cust_alt_inv_dept: cs.cust_alt_inv_dept,
    cust_no_invoice: cs.cust_no_invoice,
    cust_alt_inv_cost_center: cs.cust_alt_inv_cost_center,
    cust_street_no: cs.cust_street_no,
    cust_alt_inv_order_no: cs.cust_alt_inv_order_no,
    cust_cost_center: cs.cust_cost_center,
    cust_alt_inv_name_01: cs.cust_alt_inv_name_01,
    cust_acc_until:  toString(cs.cust_acc_until),
    cust_share_klein: cs.cust_share_klein,
    cust_alt_inv_name_02: cs.cust_alt_inv_name_02,
    cust_alt_inv_name_03: cs.cust_alt_inv_name_03,
    cust_alt_inv_street_no: cs.cust_alt_inv_street_no,
    cust_dept: cs.cust_dept,
    cust_alt_inv_contact_user: cs.cust_alt_inv_contact_user,
    cust_status: cs.cust_status,
    cust_alt_inv_email: cs.cust_alt_inv_email,
    cust_disc_perc: cs.cust_disc_perc,
    cust_paid_until: toString(cs.cust_paid_until),
    cust_name_03: cs.cust_name_03,
    cust_name_02: cs.cust_name_02,
    cust_name_01: cs.cust_name_01,
    cust_rate: cs.cust_rate,
    cust_gtc_accepted: cs.cust_gtc_accepted,
    cust_order_no: cs.cust_order_no,
    cust_alt_inv_city: cs.cust_alt_inv_city,
    cust_contact_user_salut: cs.cust_contact_user_salut,
    cust_zip: cs.cust_zip,
    cust_alt_inv_zip: cs.cust_alt_inv_zip,
    cust_country: cs.cust_country,
    cust_alt_inv_salut: cs.cust_alt_inv_salut,
    cust_id: cs.cust_id,
    cust_vat_id: cs.cust_vat_id,
    cust_rmk: cs.cust_rmk,
    cust_city: cs.cust_city
  },
  iso_3166_1_alpha_2: cou.iso_3166_1_alpha_2,
  cust_country_de: cou.country_name_de,
  cust_country_en: cou.country_name_en,
  country_id: cou.country_id,
  cust_inv_currency: curr.iso_4217,
  cust_inv_currency_id: curr.currency_id,
  cust_inv_lang_de: lang.lang_de,
  cust_inv_lang_en: lang.lang_en,
  cust_inv_lang_id: lang.lang_id,
  cust_alt_inv_country_de: cou2.country_sub_name_de,
  cust_alt_inv_country_en: cou2.country_sub_name_en,
  cust_alt_inv_country_id: cou2.country_id } AS customerDetails`;

exports.createNewCustomerSate = `
MATCH (c:Customer)-[r1:HAS_CUST_STATE]->(cs:Customer_State)
WHERE c.cust_id = $cust_id AND r1.to IS NULL
MATCH (curr:Currency) WHERE curr.currency_id = $cust_inv_currency_id
MATCH (u:User) WHERE u.user_email = $cust_contact_user
MATCH (cou1:Country) WHERE cou1.country_id = $country_id
OPTIONAL MATCH (lang:Language) WHERE lang.lang_id = $cust_inv_lang_id
OPTIONAL MATCH (cou2:Country) WHERE cou2.country_id = $cust_alt_inv_country_id
SET r1.to = apoc.date.currentTimestamp()
CREATE (ncs:Customer_State $customer_state)<-[:HAS_CUST_STATE {from:apoc.date.currentTimestamp()}]-(c)
MERGE (ncs)-[:HAS_CUST_STATE_PRED {from: apoc.date.currentTimestamp()}]->(cs)
MERGE (ncs)-[:TO_BE_INVOICED_IN_CURRENCY {from:apoc.date.currentTimestamp()}]->(curr)
MERGE (ncs)-[:CUST_HAS_CONTACT_USER {from:apoc.date.currentTimestamp()}]->(u)
MERGE (ncs)-[:IS_LOCATED_IN_COUNTRY {from:apoc.date.currentTimestamp()}]->(cou1)
FOREACH (_ IN CASE WHEN lang IS NOT NULL THEN [1] END | MERGE (ncs)-[:INV_IN_LANG {from:apoc.date.currentTimestamp()}]->(lang))
FOREACH (_ IN CASE WHEN cou2 IS NOT NULL THEN [1] END | MERGE (ncs)-[:INV_TO_ALT_COUNTRY {from:apoc.date.currentTimestamp()}]->(cou2))
RETURN ncs`;
