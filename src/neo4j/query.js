const { constants } = require("../utils");

// -(u:User {user_email: user_email: $user_email}})
exports.getUserStateInformationQUery = `
MATCH (us:User_State)<-[r1:HAS_USER_STATE]-(u:User {user_email: $user_email })
WHERE r1.to IS NULL
  Call { With u MATCH (u:User)-[r2:USER_TO_CUSTOMER]->(c:Customer)-[r3:HAS_CUST_STATE]->(cs:Customer_State)
    WHERE r3.to IS NULL
    RETURN collect({ cust_id: c.cust_id, cust_acc_until: toString(cs.cust_acc_until), cust_gtc_accepted: cs.cust_gtc_accepted, user_is_cust_admin: r2.user_is_cust_admin, cust_spec_cont: r2.cust_spec_cont, single_user: cs.cust_single, user_to: r2.to } ) AS cust_states }
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
  user_sex: us.user_sex,
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
RETURN us, u`;

exports.getUser = `
MATCH (u:User)-[r1:HAS_USER_STATE]->(us:User_State)
WHERE u.user_email = $user_email AND r1.to IS NULL
CALL {
WITH us
MATCH (us:User_State)-[r2:USER_WANTS_NL_FROM_COUNTRY]->(cou2:Country)
RETURN collect({country_id: cou2.country_id, country_name_de: cou2.country_name_de, country_name_en: cou2.country_name_en, iso_3166_1_alpha_2: cou2.iso_3166_1_alpha_2, iso_3166_1_alpha_3: cou2.iso_3166_1_alpha_3}) AS cou3
}
OPTIONAL MATCH (us)-[:USER_HAS_PREF_SURF_LANG]->(lang1:Language)
OPTIONAL MATCH (us)-[:USER_HAS_PREF_1ST_LANG]->(lang2:Language)
OPTIONAL MATCH (us)-[:USER_HAS_PREF_2ND_LANG]->(lang3:Language)
OPTIONAL MATCH (us)-[:USER_HAS_PREF_COUNTRY]->(cou1:Country)
RETURN u, us, lang1, lang2, lang3, cou1, cou3`;

exports.newUser = `
CREATE (u:User {user_email: $user_email})-[:HAS_USER_STATE {from: apoc.date.currentTimestamp()}]->(us:User_State $user_state)
WITH u, us
OPTIONAL MATCH (lang1:Language {iso_639_1: $user_pref_surf_lang_iso_639_1})
OPTIONAL MATCH (lang2:Language {iso_639_1: $user_pref_1st_lang_iso_639_1})
OPTIONAL MATCH (lang3:Language {iso_639_1: $user_pref_2nd_lang_iso_639_1})
OPTIONAL MATCH (cou1:Country {iso_3166_1_alpha_2: $user_pref_country_iso_3166_1_alpha_2})
CALL {
  OPTIONAL MATCH (cou3:Country) WHERE cou3.iso_3166_1_alpha_2 IN $user_want_nl_from_country_iso_3166_1_alpha_2
  RETURN collect(cou3) AS cou3
}
FOREACH (_ IN CASE WHEN lang1 IS NOT NULL THEN [1] END | MERGE (us)-[:USER_HAS_PREF_SURF_LANG]->(lang1))
FOREACH (_ IN CASE WHEN lang2 IS NOT NULL THEN [1] END | MERGE (us)-[:USER_HAS_PREF_1ST_LANG]->(lang2))
FOREACH (_ IN CASE WHEN lang3 IS NOT NULL THEN [1] END | MERGE (us)-[:USER_HAS_PREF_2ND_LANG]->(lang3))
FOREACH (_ IN CASE WHEN cou1 IS NOT NULL THEN [1] END | MERGE (us)-[:USER_HAS_PREF_COUNTRY]->(cou1))
FOREACH (cou IN cou3 | MERGE (us)-[:USER_WANTS_NL_FROM_COUNTRY]->(cou))
FOREACH (_ IN CASE WHEN $user_is_sys_admin IS NOT NULL THEN [1] END | SET u.user_is_sys_admin = $user_is_sys_admin)
FOREACH (_ IN CASE WHEN $user_is_author IS NOT NULL THEN [1] END | SET u.user_is_author = $user_is_author)
RETURN u, us, lang1, lang2, lang3, cou1, cou3`;

exports.createUser = `
MATCH (u:User)-[r1:HAS_USER_STATE]->(us:User_State)
WHERE u.user_email = $user_email AND r1.to IS NULL
OPTIONAL MATCH (lang1:Language {iso_639_1: $user_pref_surf_lang_iso_639_1})
OPTIONAL MATCH (lang2:Language {iso_639_1: $user_pref_1st_lang_iso_639_1})
OPTIONAL MATCH (lang3:Language {iso_639_1: $user_pref_2nd_lang_iso_639_1})
OPTIONAL MATCH (cou1:Country {iso_3166_1_alpha_2: $user_pref_country_iso_3166_1_alpha_2})
CALL {
  OPTIONAL MATCH (cou3:Country) WHERE cou3.iso_3166_1_alpha_2 IN $user_want_nl_from_country_iso_3166_1_alpha_2
  RETURN collect(cou3) AS cou3
}
SET r1.to = apoc.date.currentTimestamp()
CREATE (nus:User_State $user_state)<-[:HAS_USER_STATE { from: apoc.date.currentTimestamp()}]-(u)
MERGE (nus)-[:HAS_USER_STATE_PRED {from: apoc.date.currentTimestamp()}]->(us)
FOREACH (_ IN CASE WHEN $email IS NOT NULL THEN [1] END | SET u.user_email = $email)
FOREACH (_ IN CASE WHEN lang1 IS NOT NULL THEN [1] END | MERGE (nus)-[:USER_HAS_PREF_SURF_LANG]->(lang1))
FOREACH (_ IN CASE WHEN lang2 IS NOT NULL THEN [1] END | MERGE (nus)-[:USER_HAS_PREF_1ST_LANG]->(lang2))
FOREACH (_ IN CASE WHEN lang3 IS NOT NULL THEN [1] END | MERGE (nus)-[:USER_HAS_PREF_2ND_LANG]->(lang3))
FOREACH (_ IN CASE WHEN cou1 IS NOT NULL THEN [1] END | MERGE (nus)-[:USER_HAS_PREF_COUNTRY]->(cou1))
FOREACH (cou IN cou3 | MERGE (nus)-[:USER_WANTS_NL_FROM_COUNTRY]->(cou))
FOREACH (_ IN CASE WHEN $user_is_sys_admin IS NOT NULL THEN [1] END | SET u.user_is_sys_admin = $user_is_sys_admin)
FOREACH (_ IN CASE WHEN $user_is_author IS NOT NULL THEN [1] END | SET u.user_is_author = $user_is_author)
RETURN nus`;

exports.invitationAcceptedByUser = `
MATCH (u:User)-[r1:HAS_USER_STATE]->(us:User_State)
WHERE u.user_email = $user_email AND r1.to IS NULL AND u.user_status = "invited"
OPTIONAL MATCH (lang1:Language {iso_639_1: $user_pref_surf_lang_iso_639_1})
OPTIONAL MATCH (lang2:Language {iso_639_1: $user_pref_1st_lang_iso_639_1})
OPTIONAL MATCH (lang3:Language {iso_639_1: $user_pref_2nd_lang_iso_639_1})
OPTIONAL MATCH (cou1:Country {iso_3166_1_alpha_2: $user_pref_country_iso_3166_1_alpha_2})
CALL {
  OPTIONAL MATCH (cou3:Country) WHERE cou3.iso_3166_1_alpha_2 IN $user_want_nl_from_country_iso_3166_1_alpha_2
  RETURN collect(cou3) AS cou3
}
SET r1.to = apoc.date.currentTimestamp()
REMOVE u.user_status
CREATE (nus:User_State $user_state)<-[:HAS_USER_STATE { from: apoc.date.currentTimestamp()}]-(u)
MERGE (nus)-[:HAS_USER_STATE_PRED {from: apoc.date.currentTimestamp()}]->(us)
FOREACH (_ IN CASE WHEN $email IS NOT NULL THEN [1] END | SET u.user_email = $email)
FOREACH (_ IN CASE WHEN lang1 IS NOT NULL THEN [1] END | MERGE (nus)-[:USER_HAS_PREF_SURF_LANG]->(lang1))
FOREACH (_ IN CASE WHEN lang2 IS NOT NULL THEN [1] END | MERGE (nus)-[:USER_HAS_PREF_1ST_LANG]->(lang2))
FOREACH (_ IN CASE WHEN lang3 IS NOT NULL THEN [1] END | MERGE (nus)-[:USER_HAS_PREF_2ND_LANG]->(lang3))
FOREACH (_ IN CASE WHEN cou1 IS NOT NULL THEN [1] END | MERGE (nus)-[:USER_HAS_PREF_COUNTRY]->(cou1))
FOREACH (cou IN cou3 | MERGE (nus)-[:USER_WANTS_NL_FROM_COUNTRY]->(cou))
FOREACH (_ IN CASE WHEN $user_is_sys_admin IS NOT NULL THEN [1] END | SET u.user_is_sys_admin = $user_is_sys_admin)
FOREACH (_ IN CASE WHEN $user_is_author IS NOT NULL THEN [1] END | SET u.user_is_author = $user_is_author)
RETURN nus`;

exports.getUserCustomerList = `
MATCH (u:User)-[:USER_TO_CUSTOMER]->(c:Customer)-[r1:HAS_CUST_STATE]->(cs:Customer_State)
WHERE u.user_email = $user_email AND r1.to IS NULL
RETURN cs`;

exports.isExistsUserInCustomer = `
MATCH (u:User)-[:USER_TO_CUSTOMER]->(c:Customer)-[r1:HAS_CUST_STATE]->(cs:Customer_State)
WHERE  c.cust_id = $cust_id AND u.user_email = $user_email AND r1.to IS NULL
RETURN count(cs) as count`;

exports.getConnectUserList = `
MATCH (u:User { user_email: $user_email})-[:USER_TO_CUSTOMER]->(c:Customer)
MATCH (c)<-[:USER_TO_CUSTOMER]-(u2)
Return u2
ORDER BY toLower(u2.user_email) ASC`;

exports.getUsersNotConnectByCustomer = `
MATCH (c:Customer)
WITH collect(c) as cust
MATCH (u:User)
OPTIONAL MATCH (u)-[:USER_TO_CUSTOMER]->(i)
WHERE i in cust
WITH u
WHERE i IS NULL AND u.user_email IS NOT NULL
RETURN u
ORDER BY toLower(u.user_email) ASC`;

exports.addUserToCustomer = `
OPTIONAL MATCH (c:Customer {cust_id: $cust_id})
OPTIONAL MATCH (u:User {user_email: $user_email})
FOREACH (_ IN CASE WHEN u IS NOT NULL AND c IS NOT NULL THEN [1] END | MERGE (u)-[r1:USER_TO_CUSTOMER]->(c))
Return u, c`;

exports.getUsersCountQuery = (condition = "") => `
MATCH (us:User_State)<-[r2:HAS_USER_STATE]-(u:User)
${condition}
RETURN count(u) as count`;

exports.getUsersQuery = (
  condition = "",
  limit = 10,
  skip = 0,
  orderBy = "u.user_email ASC"
) => `
MATCH (us:User_State)<-[r2:HAS_USER_STATE]-(u:User)
${condition}
OPTIONAL MATCH p = (u)-[r1:USER_TO_CUSTOMER]->(c:Customer)
WHERE r1.to IS NULL
RETURN u,us,r1
ORDER BY ${orderBy}
SKIP toInteger(${skip})
LIMIT toInteger(${limit})`;

exports.getCustomerByCustomerId = `
MATCH (c:Customer)-[r1:HAS_CUST_STATE]->(cs:Customer_State)
WHERE c.cust_id = $customerId and r1.to IS NULL
RETURN c, cs`;

exports.getCustomerUsersCountQuery = (condition = "") => `
  MATCH (us:User_State)<-[r2:HAS_USER_STATE]-(u:User)-[r1:USER_TO_CUSTOMER]->(c:Customer)
  ${condition}
  RETURN count(u) as count`;

exports.getCustomerUsersQuery = (
  condition = "",
  limit = 10,
  skip = 0,
  orderBy = "c.user_email ASC"
) => `
  MATCH (us:User_State)<-[r2:HAS_USER_STATE]-(u:User)-[r1:USER_TO_CUSTOMER]->(c:Customer)
    ${condition}
    RETURN u, c, us, r1
    ORDER BY ${orderBy}
    SKIP toInteger(${skip})
    LIMIT toInteger(${limit})`;

// Get common logging query function
exports.getCommonUserStateLogginQuery = (otherParams = null) => {
  const params = otherParams ? `, ${otherParams}` : "";
  return `MATCH (a: Log_Type { log_type_id: $type })
  MATCH (b:User { user_email: $user_email } )-[HAS_USER_STATE]->(:User_State)
  MERGE (b)<-[:LOG_FOR_USER]-(:Log { log_timestamp: apoc.date.currentTimestamp() ${params} })-[:HAS_LOG_TYPE]->(a);`;
};

exports.logCustomer = `
MATCH (a: Log_Type {log_type_id:$type})
MATCH (b:User {user_email: $current_user_email})
MATCH (c:Customer {cust_id: $cust_id})
MERGE (b)<-[:LOG_FOR_USER]-(l1:Log{log_timestamp: apoc.date.currentTimestamp()})-[:HAS_LOG_TYPE]->(a)
MERGE (l1)-[:LOG_REFERS_TO_OBJECT]->(c);`;

exports.logUser = `
MATCH (a: Log_Type {log_type_id: $type})
MATCH (b:User {user_email: $current_user_email})
MERGE (b)<-[:LOG_FOR_USER]-(l1:Log{log_timestamp: apoc.date.currentTimestamp()})-[:HAS_LOG_TYPE]->(a)
MERGE (l1)-[:LOG_REFERS_TO_OBJECT]->(b);`;

exports.logUserByAdmin = `
MATCH (a: Log_Type {log_type_id: $type})
MATCH (b:User {user_email: $current_user_email})
MATCH (u:User {user_email: $user_email})
MERGE (b)<-[:LOG_FOR_USER]-(l1:Log{log_timestamp: apoc.date.currentTimestamp()})-[:HAS_LOG_TYPE]->(a)
MERGE (l1)-[:LOG_REFERS_TO_OBJECT]->(u);`;

exports.logInvoice = `
MATCH (a: Log_Type {log_type_id: $type})
MATCH (b:User {user_email: $current_user_email})
MATCH (inv:Invoice {inv_id_strg: $inv_id_strg})
MERGE (b)<-[:LOG_FOR_USER]-(l1:Log{log_timestamp: apoc.date.currentTimestamp()})-[:HAS_LOG_TYPE]->(a)
MERGE (l1)-[:LOG_REFERS_TO_OBJECT]->(inv);`;

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

exports.unsubscribeNLForUser = `
MATCH ( us:User_State )<-[r1:HAS_USER_STATE]-(u:User {user_email: $user_email })
WHERE r1.to IS NULL
SET us.nl_email_unsubscribed = TRUE
RETURN u, us`;

exports.tweetNewsletter = `
MATCH ( nl:Nl { nl_id: $nl_id })
SET nl.nl_tweeted = TRUE
RETURN nl`;

exports.getNewsLetterContentLink = `
MATCH (l:Link) RETURN l`;

exports.updateGDPRAccept = `
MATCH ( us:User_State )<-[r1:HAS_USER_STATE]-(u:User {user_email: $user_email })
WHERE r1.to IS NULL
SET us.user_gdpr_accepted = apoc.date.currentTimestamp();`;

exports.getUserByEmail = `
MATCH (us:User_State)<-[r1:HAS_USER_STATE]-(u:User { user_email: $user_email })
MATCH (us)-[r2:USER_HAS_PREF_SURF_LANG]->(l1:Language)
WHERE r1.to IS NULL
RETURN us as userState, l1.iso_639_1 as user_surf_lang, u`;

exports.getUserByEmailWithCustomer = `
MATCH (us:User_State)<-[r1:HAS_USER_STATE]-(u:User { user_email: $user_email })
WHERE r1.to IS NULL
OPTIONAL MATCH (u)-[r2:USER_TO_CUSTOMER]->(c:Customer)
OPTIONAL MATCH (us)-[r3:USER_HAS_PREF_SURF_LANG]->(l1:Language)
RETURN us , c, l1.iso_639_1 as user_surf_lang`;

exports.setPasswordToken = `
MATCH ( us:User_State)<-[r1:HAS_USER_STATE]-(u:User {user_email: $user_email })
SET us.reset_pwd_token = $token, us.reset_pwd_token_expiry_date = $resetTokenExpiryDate
RETURN us as userState;`;

exports.getUserByToken = `
MATCH (us:User_State)<-[r1:HAS_USER_STATE]-(u:User)
WHERE us.reset_pwd_token = $token AND r1.to IS NULL
RETURN us as userState, u.user_email as userEmail`;

exports.getUserByEmailVerificationToken = `
MATCH (u:User { email_verification_token: $token })-[r1:HAS_USER_STATE]->(us:User_State)
WHERE r1.to IS NULL
OPTIONAL MATCH (us)-[r2:USER_HAS_PREF_SURF_LANG]->(l1:Language)
FOREACH (_ IN CASE WHEN u IS NOT NULL THEN [1] END | REMOVE u.email_verification_token, u.is_email_verified)
RETURN u, us, l1`;

exports.setEmailVerifyToken = `
MATCH (u:User { user_email: $user_email })
FOREACH (_ IN CASE WHEN u IS NOT NULL THEN [1] END | SET u.email_verification_token = $token)
RETURN u`;

exports.getUserByInvitationToken = `
MATCH (u:User)-[r1:HAS_USER_STATE]->(us:User_State)
WHERE us.invitation_token = $token AND r1.to IS NULL AND u.user_status = "invited"
CALL {
WITH us
MATCH (us:User_State)-[r2:USER_WANTS_NL_FROM_COUNTRY]->(cou2:Country)
RETURN collect({country_id: cou2.country_id, country_name_de: cou2.country_name_de, country_name_en: cou2.country_name_en, iso_3166_1_alpha_2: cou2.iso_3166_1_alpha_2, iso_3166_1_alpha_3: cou2.iso_3166_1_alpha_3}) AS cou3
}
OPTIONAL MATCH (us)-[:USER_HAS_PREF_SURF_LANG]->(lang1:Language)
OPTIONAL MATCH (us)-[:USER_HAS_PREF_1ST_LANG]->(lang2:Language)
OPTIONAL MATCH (us)-[:USER_HAS_PREF_2ND_LANG]->(lang3:Language)
OPTIONAL MATCH (us)-[:USER_HAS_PREF_COUNTRY]->(cou1:Country)
OPTIONAL MATCH (u)-[:USER_INVITED_BY]->(ui:User)
RETURN u, us, lang1, lang2, lang3, cou1, cou3, ui
LIMIT 1`;

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

exports.getNewsletterYearList = (queryParams) => {
  let nlCountry = "";
  if (queryParams.country && queryParams.country.length > 0) {
    queryParams.country.forEach((ln) => {
      nlCountry = `${nlCountry}, "${ln.toUpperCase()}"`;
    });
  }
  let query = `
  MATCH (nls:Nl_State)<-[:HAS_NL_STATE]-(nl:Nl)-[:NL_REFERS_TO_COUNTRY]->(cou:Country)
  MATCH (nls)-[r3:NL_LANG_IS]->(lang:Language)
  WHERE nl.nl_active = true
  `;
  if (queryParams.lang) {
    query = `${query} AND lang.iso_639_1 = "${queryParams.lang}"`;
  }
  if (queryParams.country) {
    nlCountry = nlCountry.replace(/^,|,$/g, "");
    query = `${query} AND cou.iso_3166_1_alpha_2 IN [${nlCountry}]`;
  }
  query = `${query}
  RETURN DISTINCT nl.nl_date.year as year
  ORDER BY nl.nl_date.year DESC`;

  return query;
};

exports.getNewsletterListByYear = (queryParams) => {
  let nlCountry = "";
  if (queryParams.country && queryParams.country.length > 0) {
    queryParams.country.forEach((ln) => {
      nlCountry = `${nlCountry}, "${ln.toUpperCase()}"`;
    });
  }
  let query = `
  MATCH (nls:Nl_State)<-[:HAS_NL_STATE]-(nl:Nl)-[:NL_REFERS_TO_COUNTRY]->(cou:Country)
  MATCH (nls)-[r3:NL_LANG_IS]->(lang:Language)
  WHERE nl.nl_active = true
  `;
  if (queryParams.lang) {
    query = `${query} AND lang.iso_639_1 = "${queryParams.lang}"`;
  }
  if (queryParams.country) {
    nlCountry = nlCountry.replace(/^,|,$/g, "");
    query = `${query} AND cou.iso_3166_1_alpha_2 IN [${nlCountry}]`;
  }
  if (queryParams.currentYear) {
    query = `${query} AND nl.nl_date.year = ${queryParams.currentYear}`;
  }
  query = `${query}
  CALL {
    WITH nls
    MATCH (nls)-[:NL_LANG_IS]->(lang:Language)
    RETURN collect({ nls: nls, lang: lang }) AS nlState
  }
  OPTIONAL MATCH (user:User { user_email: "${queryParams.userEmail}"})
  RETURN nl, nlState as nls, lang, cou, user
  ORDER BY nl.nl_ord DESC`;

  return query;
};

exports.getNewsletterByLang = `
MATCH (nls:Nl_State)<-[:HAS_NL_STATE]-(nl:Nl)-[:NL_REFERS_TO_COUNTRY]->(cou:Country)
MATCH (nls)-[r3:NL_LANG_IS]->(lang:Language)
WHERE nl.nl_active = true AND cou.iso_3166_1_alpha_2 IN $country AND lang.iso_639_1 = $lang
RETURN nl, nls, cou, lang
ORDER BY nl.nl_ord DESC
LIMIT toInteger($limit)`;

exports.getDefaultNewsletter = `
MATCH (nls:Nl_State)<-[:HAS_NL_STATE]-(nl:Nl)-[:NL_REFERS_TO_COUNTRY]->(cou:Country)
MATCH (nls)-[r3:NL_LANG_IS]->(lang:Language)
WHERE nl.nl_active = true AND lang.iso_639_1 = $lang
RETURN nl, nls, cou, lang
ORDER BY nl.nl_ord DESC
LIMIT toInteger($limit)`;

exports.getSolListCount = (condition = "") => `
MATCH (cou:Country)<-[:SOL_STEMS_FROM_COUNTRY]-(sl:Sol)-[:HAS_SOL_STATE]->(sls:Sol_State)-[:SOL_STATE_LANGUAGE_IS]->(lang:Language)
${condition}
RETURN count(*) as count`;

exports.getSolList = (
  condition,
  limit = 10,
  skip = 0,
  orderBy = "sl.sol_date DESC"
) => `
MATCH (cou:Country)<-[:SOL_STEMS_FROM_COUNTRY]-(sl:Sol)-[:HAS_SOL_STATE]->(sls:Sol_State)-[:SOL_STATE_LANGUAGE_IS]->(lang:Language)
${condition}
RETURN cou, sl, sls, lang
ORDER BY ${orderBy}
SKIP toInteger(${skip})
LIMIT toInteger(${limit})`;

exports.getSolsCount = (condition = "") => `
MATCH (cou:Country)<-[:SOL_STEMS_FROM_COUNTRY]-(sl:Sol)-[:HAS_SOL_STATE]->(sls:Sol_State)
${condition}
RETURN count (distinct sl) as count`;

exports.getSols = (
  condition,
  limit = 10,
  skip = 0,
  orderBy = "sl.sol_date DESC"
) => `
MATCH (cou:Country)<-[:SOL_STEMS_FROM_COUNTRY]-(sl:Sol)-[:HAS_SOL_STATE]->(sls:Sol_State)
${condition}
CALL {
  WITH sl
  MATCH (sl)-[:HAS_SOL_STATE]->(sls:Sol_State)-[:SOL_STATE_LANGUAGE_IS]->(lang:Language)
  RETURN collect({ sls: sls, lang: lang }) AS slState
}
RETURN distinct sl, cou, slState as sls
ORDER BY ${orderBy}
SKIP toInteger(${skip})
LIMIT toInteger(${limit})`;

exports.getSolType = `
MATCH path=(st1:Sol_Type)-[:HAS_SOL_TYPE_CHILD*0..]->(st2:Sol_Type)-[:SOL_TYPE_STEMS_FROM_COUNTRY]->(cou:Country)
WHERE st1.sol_type_desc = 'Sol root object'
WITH COLLECT(path) AS paths
CALL apoc.convert.toTree(paths) YIELD value
RETURN value`;

exports.getRuleBooks = `
MATCH path=(rbs1:Rule_Book_Struct)-[:HAS_RULE_BOOK_STRUCT_CHILD*0..]->(rbs2:Rule_Book_Struct)-[:HAS_RULE_BOOK_STRUCT_STATE]->(rbss:Rule_Book_Struct_State)-[:RULE_BOOK_STRUCT_LANGUAGE_IS]->(lang:Language)
WHERE rbs1.rule_book_struct_id = 'Rule Root Object'
WITH COLLECT(path) AS paths
CALL apoc.convert.toTree(paths) YIELD value
RETURN value`;

exports.getNewsLetterListCount = (condition = "") => `
MATCH (cou:Country)<-[:NL_REFERS_TO_COUNTRY]-(nl:Nl)-[:HAS_NL_STATE]->(nls:Nl_State)-[:NL_LANG_IS]->(lang:Language)
${condition}
RETURN count(*) as count`;

exports.getNewsLetterList = (
  condition,
  limit = 10,
  skip = 0,
  orderBy = "nl.nl_ord DESC"
) => `
MATCH (cou:Country)<-[:NL_REFERS_TO_COUNTRY]-(nl:Nl)-[:HAS_NL_STATE]->(nls:Nl_State)-[:NL_LANG_IS]->(lang:Language)
${condition}
RETURN nl, nls, lang, cou
ORDER BY ${orderBy}
SKIP toInteger(${skip})
LIMIT toInteger(${limit})`;

exports.deleteNewsletter = `
MATCH (nl:Nl {nl_id: $nl_id})-[:HAS_NL_STATE]->(nls:Nl_State)
DETACH DELETE nl, nls
RETURN nl,nls`;

exports.deleteNewsletterEmail = `
MATCH (nle:Nl_Email {nl_email_ord: $nl_email_ord})-[:HAS_NL_EMAIL_STATE]->(nles:Nl_Email_State)
WHERE nle.nl_email_sent = false OR nle.nl_email_sent = NULL
DETACH DELETE nle, nles
RETURN nle,nles`;

exports.getNewsLetterTagForEmail = `
MATCH (cou:Country)<-[:NL_REFERS_TO_COUNTRY]-(nl:Nl)
WHERE nl.nl_active = true
CALL {
  WITH nl
  MATCH (nl)-[:HAS_NL_STATE]->(nls:Nl_State)-[:NL_LANG_IS]->(lang:Language)
  RETURN collect({ nls: nls, lang: lang }) AS nlState
}
RETURN nl, nlState as nls, cou
ORDER BY nl.nl_ord DESC`;

exports.getNewsLetterEmailListCount = (condition = "") => `
MATCH (nle:Nl_Email)
${condition}
CALL {
  WITH nle
  MATCH (nle)-[:HAS_NL_EMAIL_STATE]->(nles:Nl_Email_State)
  RETURN collect(nles) AS nles
}
RETURN count(*) as count`;

exports.getNewsLetterEmailList = (
  condition,
  limit = 10,
  skip = 0,
  orderBy = "nle.nl_email_ord DESC"
) => `
MATCH (nle:Nl_Email)
${condition}
CALL {
  WITH nle
  MATCH (nle)-[:HAS_NL_EMAIL_STATE]->(nles:Nl_Email_State)
  RETURN collect(nles) AS nles
}
RETURN nle, nles
ORDER BY ${orderBy}
SKIP toInteger(${skip})
LIMIT toInteger(${limit})`;

exports.logNewsletter = `
MATCH (lt: Log_Type {log_type_id: $type})
MATCH (u:User {user_email: $current_user_email})
MATCH (nl:Nl {nl_id: $nl_id})
MERGE (u)<-[:LOG_FOR_USER]-(l1:Log{log_timestamp: apoc.date.currentTimestamp()})-[:HAS_LOG_TYPE]->(lt)
MERGE (l1)-[:LOG_REFERS_TO_OBJECT]->(nl)`;

exports.logDeleteNewsletter = `
MATCH (lt: Log_Type {log_type_id: $type})
MATCH (u:User {user_email: $current_user_email})
MERGE (u)<-[:LOG_FOR_USER]-(l1:Log{log_timestamp: apoc.date.currentTimestamp()})-[:HAS_LOG_TYPE]->(lt)`;

exports.getMultipleNewsletterDetails = `
MATCH (cou:Country)<-[:NL_REFERS_TO_COUNTRY]-(nl:Nl)-[:NL_HAS_AUTHOR]->(u:User)
WHERE nl.nl_id IN $nlIds
CALL {
  WITH nl
  MATCH (nl)-[:HAS_NL_STATE]->(nls:Nl_State)-[:NL_LANG_IS]->(lang:Language)
  RETURN collect({ nls: nls, lang: lang }) AS nls
}
RETURN nl, nls, cou, u`;

exports.getUsersByNewsletterPreference = `
MATCH (u:User)-[r1:HAS_USER_STATE]->(us:User_State)-[:USER_HAS_PREF_SURF_LANG]->(lang:Language)
WHERE r1.to IS NULL AND us.nl_email_unsubscribed IS NULL AND u.user_status IS NULL AND u.is_email_verified IS NULL
CALL {
  WITH us
  MATCH (us:User_State)-[r2:USER_WANTS_NL_FROM_COUNTRY]->(cou1:Country)
  WHERE cou1.iso_3166_1_alpha_2 IN $nlCountry
  RETURN collect({iso_3166_1_alpha_2: cou1.iso_3166_1_alpha_2}) AS cou
}
RETURN u, us, lang, cou`;

exports.getNewsletterDetails = `
MATCH (cou:Country)<-[:NL_REFERS_TO_COUNTRY]-(nl:Nl)-[:NL_HAS_AUTHOR]->(u:User)
WHERE nl.nl_id = $nl_id
CALL {
  WITH nl
  MATCH (nl)-[:HAS_NL_STATE]->(nls:Nl_State)-[:NL_LANG_IS]->(lang:Language)
  RETURN collect({ nls: nls, lang: lang }) AS nls
}
CALL {
  WITH nl
  MATCH (lt: Log_Type {log_type_id: ${constants.LOG_TYPE_ID.CREATE_NL}})
  MATCH (nl)<-[:LOG_REFERS_TO_OBJECT]-(l1:Log)-[:HAS_LOG_TYPE]->(lt)
  MATCH (l1)-[:LOG_FOR_USER]->(editor:User)-[r1:HAS_USER_STATE]-(us1:User_State)
  WHERE r1.to IS NULL
  RETURN collect({timestamp: l1.log_timestamp, user_state: {user_first_name: us1.user_first_name, user_middle_name: us1.user_middle_name, user_last_name: us1.user_last_name} }) AS createdLog
}
CALL {
  WITH nl
  MATCH (lt: Log_Type {log_type_id: ${constants.LOG_TYPE_ID.UPDATE_NL}})
  MATCH (nl)<-[:LOG_REFERS_TO_OBJECT]-(l2:Log)-[:HAS_LOG_TYPE]->(lt)
  MATCH (l2)-[:LOG_FOR_USER]->(editor:User)-[r1:HAS_USER_STATE]-(us1:User_State)
  WHERE r1.to IS NULL
  RETURN collect({timestamp: l2.log_timestamp, user_state: { user_first_name: us1.user_first_name, user_middle_name: us1.user_middle_name, user_last_name: us1.user_last_name  } }) AS updatedLog
}
OPTIONAL MATCH (user:User { user_email: $user_email})
RETURN nl, nls, cou, u, user, updatedLog, createdLog`;

exports.getNewsletterLog = `
MATCH (cou:Country)<-[:NL_REFERS_TO_COUNTRY]-(nl:Nl)-[:NL_HAS_AUTHOR]->(u:User)
WHERE nl.nl_id = $nl_id
CALL {
  WITH nl
  MATCH (lt: Log_Type {log_type_id: ${constants.LOG_TYPE_ID.CREATE_NL}})
  MATCH (nl)<-[:LOG_REFERS_TO_OBJECT]-(l1:Log)-[:HAS_LOG_TYPE]->(lt)
  MATCH (l1)-[:LOG_FOR_USER]->(editor:User)-[r1:HAS_USER_STATE]-(us1:User_State)
  WHERE r1.to IS NULL
  RETURN collect({timestamp: l1.log_timestamp, user_state: {user_first_name: us1.user_first_name, user_middle_name: us1.user_middle_name, user_last_name: us1.user_last_name} }) AS createdLog
}
CALL {
  WITH nl
  MATCH (lt: Log_Type {log_type_id: ${constants.LOG_TYPE_ID.UPDATE_NL}})
  MATCH (nl)<-[:LOG_REFERS_TO_OBJECT]-(l2:Log)-[:HAS_LOG_TYPE]->(lt)
  MATCH (l2)-[:LOG_FOR_USER]->(editor:User)-[r1:HAS_USER_STATE]-(us1:User_State)
  WHERE r1.to IS NULL
  RETURN collect({timestamp: l2.log_timestamp, user_state: { user_first_name: us1.user_first_name, user_middle_name: us1.user_middle_name, user_last_name: us1.user_last_name  } }) AS updatedLog
}
RETURN updatedLog, createdLog`;

exports.getNewsletter = `
MATCH (cou:Country)<-[:NL_REFERS_TO_COUNTRY]-(nl:Nl)-[:NL_HAS_AUTHOR]->(u:User)
WHERE nl.nl_id = $nl_id
CALL {
  WITH nl
  MATCH (nl)-[:HAS_NL_STATE]->(nls:Nl_State)-[:NL_LANG_IS]->(lang:Language)
  RETURN collect({ nls: nls, lang: lang }) AS nls
}
RETURN nl, nls, cou, u`;

exports.getNewsletterEmail = `
MATCH (nle:Nl_Email)-[:NL_EMAIL_HAS_AUTHOR]->(u:User)
WHERE nle.nl_email_ord = $nl_email_ord
CALL {
  WITH nle
  MATCH (nle)-[:HAS_NL_EMAIL_STATE]->(nles:Nl_Email_State)-[:NL_EMAIL_LANG_IS]->(lang:Language)
  RETURN collect({ nles: nles, lang: lang }) AS nles
}
CALL {
  WITH nle
  MATCH (nle)-[r1:CONTAINS_LINK_TO_NL]->(nl:Nl)
  RETURN collect({nl_id:nl.nl_id, order: r1.order}) AS nl
}
RETURN nle, nles, nl`;

exports.newsletterQuery = (queryParams) => {
  let query = `
    MATCH (nl:Nl) WITH MAX(nl.nl_id) AS max_nl_id
    MATCH (u:User {user_email: $queryParams.user_email})
    MATCH (cou:Country {iso_3166_1_alpha_2: $queryParams.country.iso_3166_1_alpha_2})
    MATCH (lang1:Language {iso_639_1: "de"})
    MATCH (lang2:Language {iso_639_1: "en"})`;
  if (!queryParams.isUpdate) {
    query = `
    ${query}
    MERGE (nl:Nl {nl_id: max_nl_id + 1 })
    SET nl.nl_ord = "${queryParams.nl.nl_ord}", nl.nl_date = Date({ year: ${queryParams.nl.nl_date.year}, month: ${queryParams.nl.nl_date.month} , day: ${queryParams.nl.nl_date.day}}) , nl.nl_active = ${queryParams.nl.nl_active}, nl.nl_implemented = ${queryParams.nl.nl_implemented}`;
  } else {
    query = `
    ${query}
    MATCH (nl:Nl {nl_id: ${queryParams.nl.nl_id} })
    SET nl.nl_ord = "${queryParams.nl.nl_ord}", nl.nl_date = Date({ year: ${queryParams.nl.nl_date.year}, month: ${queryParams.nl.nl_date.month} , day: ${queryParams.nl.nl_date.day}}) , nl.nl_active = ${queryParams.nl.nl_active}, nl.nl_implemented = ${queryParams.nl.nl_implemented}`;
  }

  // Set the properties for the German version of the (Nl_State) - please do it only in case when the data-fields for the German version are filled
  // Maybe that the distinction between ON CREATE and ON MATCH is not necessary
  if (queryParams.isValidDE) {
    query = `${query}
    MERGE (nl)-[:HAS_NL_STATE]->(nls_de:Nl_State)-[:NL_LANG_IS]->(lang1)
    SET nls_de = $queryParams.nls.de`;
  }
  // Set the properties for the English version of the (Nl_State) - please do it only in case when the data-fields for the English version are filled
  // Maybe that the distinction between ON CREATE and ON MATCH is not necessary
  if (queryParams.isValidEN) {
    query = `${query}
    MERGE (nl)-[:HAS_NL_STATE]->(nls_en:Nl_State)-[:NL_LANG_IS]->(lang2)
    SET nls_en = $queryParams.nls.en`;
  }
  if (queryParams.isUpdate) {
    query = `${query}
    WITH nl,cou,u
    CALL {
      WITH nl
      MATCH (nl)-[r1:NL_REFERS_TO_COUNTRY]->()
      MATCH (nl)-[r2:NL_HAS_AUTHOR]->()
      RETURN r1, r2
    }
    DETACH DELETE r1
    DETACH DELETE r2`;
  }

  query = `${query}
    CREATE (nl)-[:NL_REFERS_TO_COUNTRY]->(cou)
    CREATE (nl)-[:NL_HAS_AUTHOR]->(u)
    RETURN nl`;

  return query;
};

exports.newsletterEmailQuery = (queryParams) => {
  let nlTags = "";
  let i = 0;
  if (queryParams.nl_tags.length > 0) {
    queryParams.nl_tags.forEach((nlId) => {
      nlTags = `${nlTags}, { order: ${(i += 1)}, nl_id: ${nlId} }`;
    });
  }
  nlTags = nlTags.replace(/^,|,$/g, "");
  let query = `
    MATCH (u:User {user_email: $queryParams.user_email})
    MATCH (lang1:Language {iso_639_1: "de"})
    MATCH (lang2:Language {iso_639_1: "en"})`;
  if (!queryParams.isUpdate) {
    query = `
    ${query}
    MERGE (nle:Nl_Email {nl_email_ord: $queryParams.nle.nl_email_ord })`;
  } else {
    query = `
    ${query}
    MATCH (nle:Nl_Email {nl_email_ord: $queryParams.nle.nl_email_ord })`;
  }
  if (queryParams.nle.nl_email_sent) {
    query = `
    ${query}
    SET nle.nl_email_date = date() , nle.nl_email_sent = $queryParams.nle.nl_email_sent`;
  } else {
    query = `
    ${query}
    SET nle.nl_email_sent = $queryParams.nle.nl_email_sent`;
  }

  if (queryParams.isValidDE) {
    query = `${query}
    MERGE (nle)-[:HAS_NL_EMAIL_STATE]->(nles_de:Nl_Email_State)-[:NL_EMAIL_LANG_IS]->(lang1)
    SET nles_de = $queryParams.nles.de`;
  }
  if (queryParams.isValidEN) {
    query = `${query}
    MERGE (nle)-[:HAS_NL_EMAIL_STATE]->(nles_en:Nl_Email_State)-[:NL_EMAIL_LANG_IS]->(lang2)
    SET nles_en = $queryParams.nles.en`;
  }
  if (queryParams.isUpdate) {
    query = `${query}
    WITH nle,u
    CALL {
      WITH nle
      MATCH (nle)-[r1:NL_EMAIL_HAS_AUTHOR]->()
      MATCH (nle)-[r2:CONTAINS_LINK_TO_NL]->()
      DETACH DELETE r1
      DETACH DELETE r2
      RETURN r1, r2
    }`;
  }

  query = `${query}
    CREATE (nle)-[:NL_EMAIL_HAS_AUTHOR]->(u)
    WITH nle
    UNWIND [${nlTags}] as nlTags
    MATCH (nl:Nl {nl_id: nlTags.nl_id})
    MERGE (nle)-[:CONTAINS_LINK_TO_NL {order: nlTags.order}]->(nl)
    RETURN nle`;

  return query;
};

exports.solQuery = (queryParams) => {
  let query = "";
  if (!queryParams.isUpdate) {
    query = `
    ${query}
    MATCH (sl:Sol) WITH MAX(sl.sol_id) + 1 AS max_sol_id`;
  }
  query = `
  ${query}
  MATCH (slt:Sol_Type {sol_type_id: ${queryParams.sol_type_id}})-[:SOL_TYPE_STEMS_FROM_COUNTRY]->(cou:Country)
  MATCH (lang1:Language {iso_639_1: "de"})
  MATCH (lang2:Language {iso_639_1: "en"})`;
  if (!queryParams.isUpdate) {
    query = `
    ${query}
    MERGE (sl:Sol {sol_id: max_sol_id })`;
  } else {
    query = `
    ${query}
    MATCH (sl:Sol {sol_id: ${queryParams.sl.sol_id} })`;
  }
  query = `
  ${query}
  SET sl.sol_date = Date({ year: ${queryParams.sl.sol_date.year}, month: ${queryParams.sl.sol_date.month} , day: ${queryParams.sl.sol_date.day}}) , sl.sol_no = "${queryParams.sl.sol_no}", sl.sol_section = "${queryParams.sl.sol_section}"`;

  if (queryParams.isValidDE) {
    query = `${query}
    MERGE (sl)-[:HAS_SOL_STATE]->(sls_de:Sol_State)-[:SOL_STATE_LANGUAGE_IS]->(lang1)
    SET sls_de = $queryParams.sls.de`;
  } else if (!queryParams.isValidDE && queryParams.isUpdate) {
    query = `${query}
    WITH sl, slt, cou, lang1, lang2
    OPTIONAL MATCH (sl)-[:HAS_SOL_STATE]->(sls_de:Sol_State)-[:SOL_STATE_LANGUAGE_IS]->(lang1)
    DETACH DELETE sls_de`;
  }
  if (queryParams.isValidEN) {
    query = `${query}
    MERGE (sl)-[:HAS_SOL_STATE]->(sls_en:Sol_State)-[:SOL_STATE_LANGUAGE_IS]->(lang2)
    SET sls_en = $queryParams.sls.en`;
  } else if (!queryParams.isValidEN && queryParams.isUpdate) {
    query = `${query}
    WITH sl, slt, cou, lang1, lang2
    OPTIONAL MATCH (sl)-[:HAS_SOL_STATE]->(sls_en:Sol_State)-[:SOL_STATE_LANGUAGE_IS]->(lang2)
    DETACH DELETE sls_en`;
  }
  if (queryParams.isUpdate) {
    query = `${query}
    WITH sl, slt, cou
    CALL {
      WITH sl
      MATCH (sl)-[r1:SOL_STEMS_FROM_COUNTRY]->()
      MATCH (sl)-[r2:HAS_SOL_TYPE]->()
      DETACH DELETE r1, r2
      RETURN r1, r2
    }
    MERGE (sl)-[:SOL_STEMS_FROM_COUNTRY]->(cou)
    MERGE (sl)-[:HAS_SOL_TYPE]->(slt)
    RETURN sl
    `;
  } else {
    query = `${query}
    MERGE (sl)-[:SOL_STEMS_FROM_COUNTRY]->(cou)
    MERGE (sl)-[:HAS_SOL_TYPE]->(slt)
    RETURN sl`;
  }
  return query;
};

exports.getSol = `
MATCH (sl:Sol)
WHERE sl.sol_id = $sol_id
OPTIONAL MATCH (sl)-[:HAS_SOL_TYPE]->(slt:Sol_Type)
CALL {
  WITH sl
  MATCH (sl)-[:HAS_SOL_STATE]->(sls:Sol_State)-[:SOL_STATE_LANGUAGE_IS]->(lang:Language)
  RETURN collect({ sls: sls, lang: lang }) AS sls
}
RETURN sl, sls, slt`;

exports.deleteSol = `
MATCH (sl:Sol {sol_id: $sol_id})-[:HAS_SOL_STATE]->(sls:Sol_State)
DETACH DELETE sl, sls
RETURN sl,sls`;

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
    cust_id: c.cust_id,
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
OPTIONAL MATCH (c)-[:TO_BE_INVOICED_FROM_COUNTRY]->(cou3:Country)
OPTIONAL MATCH (cs)-[:TO_BE_INVOICED_IN_CURRENCY]->(curr:Currency)
OPTIONAL MATCH (cs)-[:INV_IN_LANG]->(lang:Language)
RETURN {
  customer: {
    cust_id: c.cust_id
  },
  customer_state: {
    cust_contact_user: cs.cust_contact_user,
    cust_inv_spec_email: cs.cust_inv_spec_email,
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
    cust_id: c.cust_id,
    cust_vat_id: cs.cust_vat_id,
    cust_rmk: cs.cust_rmk,
    cust_city: cs.cust_city,
    cust_alt_inv_vat_id: cs.cust_alt_inv_vat_id,
    inv_goes_to_alt_rec: cs.inv_goes_to_alt_rec
  },
  cust_country_de: cou.country_name_de,
  cust_country_en: cou.country_name_en,
  country_id: cou.country_id,
  cust_inv_currency: curr.iso_4217,
  cust_inv_currency_id: curr.currency_id,
  cust_inv_lang_de: lang.lang_de,
  cust_inv_lang_en: lang.lang_en,
  cust_inv_lang_id: lang.lang_id,
  cust_alt_inv_country_de: cou2.country_name_de,
  cust_alt_inv_country_en: cou2.country_name_en,
  cust_to_be_invoiced_from_country_de : cou3.country_name_de,
  cust_to_be_invoiced_from_country_en: cou3.country_name_en,
  cust_to_be_invoiced_from_country_id: cou3.country_id,
  cust_alt_inv_country_id: cou2.country_id } AS customerDetails`;

exports.createNewCustomerSate = `
MATCH (c:Customer)-[r1:HAS_CUST_STATE]->(cs:Customer_State)
WHERE c.cust_id = $cust_id AND r1.to IS NULL
OPTIONAL MATCH (curr:Currency) WHERE curr.currency_id = $cust_inv_currency_id
MATCH (u:User) WHERE u.user_email = $cust_contact_user
MATCH (cou1:Country) WHERE cou1.country_id = $country_id
OPTIONAL MATCH (lang:Language) WHERE lang.lang_id = $cust_inv_lang_id
OPTIONAL MATCH (cou2:Country) WHERE cou2.country_id = $cust_alt_inv_country_id
OPTIONAL MATCH (cou3:Country) WHERE cou3.country_id = $cust_to_be_invoiced_from_country_id
OPTIONAL MATCH (c:Customer)-[r3:TO_BE_INVOICED_FROM_COUNTRY]->(cou4:Country {country_id: $cust_to_be_invoiced_from_country_id_old })
SET r1.to = apoc.date.currentTimestamp()
CREATE (ncs:Customer_State $customer_state)<-[:HAS_CUST_STATE {from:apoc.date.currentTimestamp()}]-(c)
MERGE (ncs)-[:HAS_CUST_STATE_PRED {from: apoc.date.currentTimestamp()}]->(cs)
MERGE (ncs)-[:CUST_HAS_CONTACT_USER {from:apoc.date.currentTimestamp()}]->(u)
MERGE (ncs)-[:IS_LOCATED_IN_COUNTRY {from:apoc.date.currentTimestamp()}]->(cou1)
FOREACH (_ IN CASE WHEN lang IS NOT NULL THEN [1] END | MERGE (ncs)-[:INV_IN_LANG {from:apoc.date.currentTimestamp()}]->(lang))
FOREACH (_ IN CASE WHEN curr IS NOT NULL THEN [1] END | MERGE (ncs)-[:TO_BE_INVOICED_IN_CURRENCY {from:apoc.date.currentTimestamp()}]->(curr))
FOREACH (_ IN CASE WHEN cou2 IS NOT NULL THEN [1] END | MERGE (ncs)-[:INV_TO_ALT_COUNTRY {from:apoc.date.currentTimestamp()}]->(cou2))
FOREACH (_ IN CASE WHEN r3 IS NOT NULL THEN [1] END | DELETE r3 )
FOREACH (_ IN CASE WHEN cou3 IS NOT NULL THEN [1] END | MERGE (c)-[:TO_BE_INVOICED_FROM_COUNTRY {from:apoc.date.currentTimestamp()}]->(cou3))
RETURN ncs`;

exports.getInvoicesCount = `
MATCH (c:Customer)<-[:INV_FOR_CUST]-(inv:Invoice)
WHERE c.cust_id = $customerId
RETURN count(inv) as count`;

exports.getInvoice = `
MATCH (c:Customer)<-[:INV_FOR_CUST]-(inv:Invoice)
WHERE inv.inv_id_strg = $invoiceId AND c.cust_id = $customerId
RETURN inv as invoice`;

exports.paidInvoice = `
MATCH (inv:Invoice { inv_id_strg: $invoiceId })
SET inv.inv_paid = $currentDate
WITH inv
MATCH (inv)-[r1:INV_FOR_CUST]->(c)-[r2:HAS_CUST_STATE]->(cs)
WHERE r2.to IS NULL
SET cs.cust_paid_until = inv.inv_date_end
SET cs.cust_acc_until = inv.inv_date_end
RETURN inv, c, cs`;

exports.getCustomerInvoiceFromCountryRelationship = `
MATCH (n:Customer {cust_id: $customerId })-[r:TO_BE_INVOICED_FROM_COUNTRY]-(cou:Country)
RETURN cou.country_id as countryId`;

exports.getPreparedNewInvoiceDetails = `
MATCH (c:Customer)-[r1:HAS_CUST_STATE]->(cs:Customer_State)
WHERE c.cust_id = $customerId and r1.to IS NULL
MATCH (lang:Language)<-[INV_IN_LANG]-(cs)-[:TO_BE_INVOICED_IN_CURRENCY]-(curr:Currency)
MATCH (cs)-[IS_LOCATED_IN_COUNTRY]->(cou2:Country)
OPTIONAL MATCH (c)-[:TO_BE_INVOICED_FROM_COUNTRY]->(cou1:Country)
OPTIONAL MATCH (cs)-[:INV_TO_ALT_COUNTRY]->(cou3:Country)
RETURN c, cs, curr, lang, cou1, cou2, cou3
`;

exports.getInvoiceCountByYearCountryAndCustomerId = `
MATCH (c:Customer)<-[:INV_FOR_CUST]-(inv:Invoice)
WHERE toLower(inv.inv_id_strg) CONTAINS toLower("$year")
  AND toLower(inv.inv_id_strg) STARTS WITH toLower("$country")
  AND toLower(inv.inv_id_strg) CONTAINS toLower("$customerIdString")
  AND c.cust_id = $customerId
RETURN Count(inv) as count`;

exports.getInvoiceCustomers = (
  condition = "",
  limit = 10,
  skip = 0,
  orderBy = "inv.inv_date DESC"
) => `
  MATCH (inv:Invoice)-[:INV_FOR_CUST]->(c:Customer)-[r1:HAS_CUST_STATE]->(cs:Customer_State)
  ${condition}
  RETURN inv as invoice, c as customer, cs as customerState
  ORDER BY ${orderBy}
  SKIP toInteger(${skip})
  LIMIT toInteger(${limit})`;

exports.getInvoiceCustomersCount = (condition = "WHERE r1.to IS NULL") => `
MATCH (inv:Invoice)-[:INV_FOR_CUST]->(c:Customer)-[r1:HAS_CUST_STATE]->(cs:Customer_State)
${condition}
RETURN count(*) as count`;

exports.createInvoice = `
MATCH (c:Customer)-[r1:HAS_CUST_STATE]->(cs:Customer_State)
WHERE c.cust_id = $customerId and r1.to IS NULL
MATCH (cou1:Country) WHERE cou1.country_id = $country_id
CREATE (inv:Invoice $invoice)-[:INV_FOR_CUST]->(c)
MERGE (inv)-[:INV_SENT_FROM]->(cou1)
RETURN cou1`;

exports.cancelInvoice = `
MATCH (inv: Invoice {inv_id_strg: $inv_id_strg})
WHERE inv.inv_paid IS NULL AND inv.inv_cancelled IS NULL
SET inv.inv_cancelled = date()
RETURN inv`;

exports.createNewCustomer = `
MATCH (c:Customer) WITH MAX(c.cust_id) AS max_cust_id
CREATE (c2:Customer {cust_id: max_cust_id + 1})-[:HAS_CUST_STATE {from: apoc.date.currentTimestamp()}]->(cs:Customer_State $customer_state)
WITH cs, c2, max_cust_id
SET cs.cust_id = max_cust_id + 1
WITH cs, c2
OPTIONAL MATCH (curr:Currency {currency_id: $cust_inv_currency_id})
MATCH (cou1:Country {country_id: $country_id})
OPTIONAL MATCH (cou2:Country {country_id: $cust_alt_inv_country_id})
OPTIONAL MATCH (cou3:Country {country_id: $cust_to_be_invoiced_from_country_id})
MATCH (u:User {user_email: $cust_contact_user})
OPTIONAL MATCH (lang:Language {lang_id: $cust_inv_lang_id})
MERGE (cs)-[:IS_LOCATED_IN_COUNTRY {from:apoc.date.currentTimestamp()}]->(cou1)
MERGE (c2)<-[:USER_TO_CUSTOMER]-(u)
FOREACH (_ IN CASE WHEN curr IS NOT NULL THEN [1] END | MERGE (curr)<-[:TO_BE_INVOICED_IN_CURRENCY]-(cs) )
FOREACH (_ IN CASE WHEN lang IS NOT NULL THEN [1] END | MERGE (lang)<-[:INV_IN_LANG]-(cs)-[:CUST_HAS_CONTACT_USER]->(u) )
FOREACH (_ IN CASE WHEN cou2 IS NOT NULL THEN [1] END | MERGE (cou2)<-[:INV_TO_ALT_COUNTRY]-(cs) )
FOREACH (_ IN CASE WHEN cou3 IS NOT NULL THEN [1] END | MERGE (c2)-[:TO_BE_INVOICED_FROM_COUNTRY {from:apoc.date.currentTimestamp()}]->(cou3) )
RETURN cs`;

exports.invite = `
MATCH (u1:User {user_email: $user_email})-[r1:HAS_USER_STATE]-(us1:User_State)
WHERE r1.to IS NULL
OPTIONAL MATCH (us1)-[:USER_HAS_PREF_COUNTRY]->(cou1:Country)
CALL {
 WITH us1
 OPTIONAL MATCH (us1)-[:USER_WANTS_NL_FROM_COUNTRY]->(cou2:Country)
 RETURN COLLECT (cou2) AS nl_cous
}
OPTIONAL MATCH (us1)-[:USER_HAS_PREF_SURF_LANG]->(lang1:Language)
OPTIONAL MATCH (us1)-[:USER_HAS_PREF_1ST_LANG]->(lang2:Language)
OPTIONAL MATCH (us1)-[:USER_HAS_PREF_2ND_LANG]->(lang3:Language)
MATCH (c:Customer {cust_id: $cust_id})
MERGE (u2:User {user_email: $new_user_email})
ON CREATE SET u2.user_status = "invited"
MERGE (u2)-[r2:USER_TO_CUSTOMER]->(c)
ON CREATE SET r2.from = apoc.date.currentTimestamp()
MERGE (us2:User_State {user_first_name: $new_user_first_name, user_last_name: $new_user_last_name, user_sex: $new_user_sex})
MERGE (u2)-[r3:HAS_USER_STATE]->(us2)
ON CREATE SET r3.from = apoc.date.currentTimestamp()
MERGE (us2)-[:USER_HAS_PREF_COUNTRY]->(cou1)
MERGE (us2)-[:USER_HAS_PREF_SURF_LANG]->(lang1)
MERGE (us2)-[:USER_HAS_PREF_1ST_LANG]->(lang2)
MERGE (us2)-[:USER_HAS_PREF_2ND_LANG]->(lang3)
FOREACH (cou IN nl_cous | MERGE (us2)-[:USER_WANTS_NL_FROM_COUNTRY]->(cou))
FOREACH (_ IN CASE WHEN $invitation_token IS NOT NULL THEN [1] END | SET us2.invitation_token = $invitation_token )
MERGE (u2)-[r4:USER_INVITED_BY]->(u1)
ON CREATE SET r4.from = apoc.date.currentTimestamp()
RETURN u2, us2`;

exports.register = (queryParams) => {
  let nlCountry = "";
  if (queryParams.user_want_nl_from_country_iso_3166_1_alpha_2.length > 0) {
    queryParams.user_want_nl_from_country_iso_3166_1_alpha_2.forEach((ln) => {
      nlCountry = `${nlCountry}, "${ln}"`;
    });
  }
  nlCountry = nlCountry.replace(/^,|,$/g, "");
  let query = `
  MATCH (c0:Customer) WITH MAX(c0.cust_id) AS max_cust_id
  MATCH (cou1:Country {iso_3166_1_alpha_2: "${queryParams.user_pref_country_iso_3166_1_alpha_2}" })
  MATCH (cou4:Country {iso_3166_1_alpha_2: "${queryParams.to_be_invoiced_from_country}"  })
  MATCH (curr:Currency {iso_4217: "${queryParams.cust_inv_currency_iso_4217}" })
  MATCH (lang1:Language {iso_639_1: "${queryParams.user_pref_1st_lang_iso_639_1}" })
  MATCH (lang2:Language  {iso_639_1: "${queryParams.user_pref_2nd_lang_iso_639_1}" })
  OPTIONAL MATCH (cou3:Country {iso_3166_1_alpha_2: "${queryParams.cust_alt_inv_country_iso_3166_1_alpha_2}" })
  CALL {
    MATCH (cou2:Country) WHERE cou2.iso_3166_1_alpha_2 IN [${nlCountry}]
    RETURN collect(cou2) AS nl_cous
  }
  MERGE (u:User { user_email: "${queryParams.user_email}" })
  ON CREATE SET u.is_email_verified = false, u.email_verification_token = "${queryParams.verificationToken}"
  `;
  if (queryParams.user_state) {
    query = `${query}
    MERGE (us:User_State { `;
    Object.keys(queryParams.user_state).forEach((key) => {
      if (typeof queryParams.user_state[key] === "string") {
        query = `${query} ${key}: "${queryParams.user_state[key]}",`;
      } else {
        query = `${query} ${key}: ${queryParams.user_state[key]},`;
      }
    });
    query = query.replace(/,\s*$/, "");
    query = `${query} })`;
  }

  query = `${query}
  MERGE (c:Customer { cust_id: max_cust_id + 1 })`;

  if (queryParams.user_state) {
    query = `${query}
    MERGE (cs:Customer_State { cust_id: max_cust_id + 1, `;
    Object.keys(queryParams.customer_state).forEach((key) => {
      if (typeof queryParams.customer_state[key] === "string") {
        query = `${query} ${key}: "${queryParams.customer_state[key]}",`;
      } else if (key === "cust_acc_until" || key === "cust_paid_until") {
        query = `${query} ${key}: Date({ year: ${queryParams.customer_state[key].year}, month: ${queryParams.customer_state[key].month} , day: ${queryParams.customer_state[key].day} }),`;
      } else {
        query = `${query} ${key}: ${queryParams.customer_state[key]},`;
      }
    });
    query = query.replace(/,\s*$/, "");
    query = `${query} })`;
  }
  query = `${query}
  MERGE (c)-[r1:HAS_CUST_STATE]->(cs)
  ON CREATE SET r1.from = apoc.date.currentTimestamp()
  MERGE (c)-[:TO_BE_INVOICED_FROM_COUNTRY]->(cou4)
  MERGE (cs)-[:IS_LOCATED_IN_COUNTRY]->(cou1)

  MERGE (c)<-[r2:USER_TO_CUSTOMER]-(u)
  ON CREATE SET r2.from = apoc.date.currentTimestamp()

  MERGE (u)-[r3:HAS_USER_STATE]->(us)
  ON CREATE SET r3.from = apoc.date.currentTimestamp()

  MERGE (u)<-[r4:CUST_HAS_CONTACT_USER]-(cs)
  ON CREATE SET r4.from = apoc.date.currentTimestamp()

  MERGE (cs)-[:TO_BE_INVOICED_IN_CURRENCY]->(curr)

  MERGE (us)-[:USER_HAS_PREF_COUNTRY]->(cou1)

  MERGE (us)-[:USER_HAS_PREF_SURF_LANG]->(lang1)
  MERGE (us)-[:USER_HAS_PREF_1ST_LANG]->(lang1)
  MERGE (us)-[:USER_HAS_PREF_2ND_LANG]->(lang2)
  MERGE (cs)-[:INV_IN_LANG]->(lang1)

  FOREACH (cou IN nl_cous | MERGE (us)-[:USER_WANTS_NL_FROM_COUNTRY]->(cou))
  FOREACH (_ IN CASE WHEN ${queryParams.is_cust_admin}  IS NOT NULL THEN [1] END | SET r2.user_is_cust_admin = true )
  FOREACH (_ IN CASE WHEN cou3 IS NOT NULL THEN [1] END | MERGE (cs)-[:INV_TO_ALT_COUNTRY]->(cou3) )
  RETURN c, cs, u, us`;
  return query;
};
