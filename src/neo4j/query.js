exports.getUserStateInformationQUery = `
MATCH (us:User_State {user_email: $user_email })<-[r1:HAS_USER_STATE]-(u:User)
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
  user_email: us.user_email,
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
  user_login_count: us.user_login_count
} AS User;`;

exports.loginQuery = `
MATCH (us:User_State)<-[r1:HAS_USER_STATE]-()
WHERE us.user_email = $user_email AND r1.to IS NULL
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
  MATCH (b:User)-[HAS_USER_STATE]->(:User_State { user_email: $user_email } )
  MERGE (b)<-[:LOG_FOR_USER]-(:Log { log_timestamp: apoc.date.currentTimestamp() ${params} })-[:HAS_LOG_TYPE]->(a);`;
};

exports.manageLoginCountQuery = `
MATCH (us:User_State {user_email: $user_email})
SET us.user_login_count = us.user_login_count + 1
SET us.user_last_login = apoc.date.currentTimestamp();`;

exports.logICustomerGTCQuery = `
MATCH (a: Log_Type { log_type_id: $type })
MATCH (c:Customer)<-[USER_TO_CUSTOMER]-(:User)-[HAS_USER_STATE]->(:User_State {user_email: $user_email})
MERGE (c)<-[:LOG_FOR_CUSTOMER]-(:Log{log_timestamp: apoc.date.currentTimestamp()})-[:HAS_LOG_TYPE]->(a);`;

exports.logInvalidEmailQuery = `
MATCH (n:Log_Type { log_type_id: $type } )
MERGE(:Log { log_timestamp: apoc.date.currentTimestamp(), log_par_01: $user_email, log_par_02: $user_pwd })-[:HAS_LOG_TYPE]-> (n);`;

exports.updateGTCAccept = `
MATCH (cs:Customer_State)<-[HAS_CUSTOMER_STATE]-(c:Customer)<-[r:USER_TO_CUSTOMER]-(:User)-[HAS_USER_STATE]->(:User_State {user_email:$user_email})
WHERE r.user_is_cust_admin = true OR cs.cust_single = true
SET cs.cust_gtc_accepted = apoc.date.currentTimestamp();`;

exports.updateGDPRAccept = `
MATCH ( us:User_State { user_email: $user_email })
SET us.user_gdpr_accepted = apoc.date.currentTimestamp();`;

exports.getUserByEmail = `
MATCH (us:User_State)<-[r1:HAS_USER_STATE]-()
WHERE us.user_email = $user_email
RETURN us as userState`;

exports.setPasswordToken = `
MATCH ( us:User_State { user_email: $user_email })
SET us.reset_pwd_token = $token, us.reset_pwd_token_expiry_date = $resetTokenExpiryDate
RETURN us as userState;`;

exports.getUserByEmail = `MATCH (us:User_State { user_email : $user_email } ) RETURN us as userState`;

exports.getUserByToken = `MATCH (us:User_State { reset_pwd_token :  $token}) RETURN us as userState`;

exports.resetUserPassword = `
MATCH ( us:User_State { user_email: $user_email })
SET us.user_pwd = $password
REMOVE us.reset_pwd_token, us.reset_pwd_token_expiry_date
RETURN us as userState;`;

exports.getNewsletterByLang = `
MATCH (nl:NL_Article)-[:NL_REFERS_TO_COUNTRY]->(cou:Country)
WHERE nl.nl_article_active = true AND cou.iso_3166_1_alpha_2 IN $LANG_ARRAY
RETURN {
nl_article_no: nl.nl_article_no,
nl_article_date: toString(nl.nl_article_date),
nl_article_title : CASE
  WHEN nl.nl_article_title_en_short is null
    THEN nl.nl_article_title_de_short
  ELSE nl.nl_article_title_en_short
  END,
nl_article_lang: cou.iso_3166_1_alpha_2
} As newLetters
ORDER BY nl.nl_article_order DESC
LIMIT 10;`;

exports.getDefaultNewsletter = `
MATCH (nl:NL_Article)-[:NL_REFERS_TO_COUNTRY]->(cou:Country)
WHERE nl.nl_article_active = true
RETURN {
  nl_article_no: nl.nl_article_no,
  nl_article_date: toString(nl.nl_article_date),
  nl_article_title : CASE
    WHEN nl.nl_article_title_en_short is null
      THEN nl.nl_article_title_de_short
    ELSE nl.nl_article_title_en_short
    END,
  nl_article_lang: cou.iso_3166_1_alpha_2
  } As newLetters
ORDER BY nl.nl_article_order DESC
LIMIT 10;`;
