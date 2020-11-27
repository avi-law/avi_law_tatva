const _ = require('lodash');
const driver = require('../../../config/db');
const { constants, auth, common } = require('../../../utils');

const query = `
MATCH (us:User_State)<-[r1:HAS_USER_STATE]-()
WHERE us.user_email = $email AND r1.to IS NULL
RETURN us as userState`;

/**
 * Get common logging query function
 * @param String params
 */
const getCommonLogginQuery = (otherParams = null) => {
  otherParams = otherParams ? `, ${otherParams}` : '';
  return `MATCH (a: Log_Type { log_type_id: $type })
  MATCH (b:User)-[HAS_USER_STATE]->(:User_State { user_email: $email } )
  MERGE (b)<-[:LOG_FOR_USER]-(:Log { log_timestamp: apoc.date.currentTimestamp() ${otherParams} })-[:HAS_LOG_TYPE]->(a);`;
};

const logInvalidEmailQuery = `
MATCH (n:Log_Type { log_type_id: $type } )
MERGE(:Log { log_timestamp: apoc.date.currentTimestamp(), log_par_01: $email, log_par_02: $password })-[:HAS_LOG_TYPE]-> (n);`;

const getUserStateInformationQUery = `
MATCH (us:User_State {user_email: $email })<-[r1:HAS_USER_STATE]-(u:User)
WHERE r1.to IS NULL
  Call { With u MATCH (u:User)-[r2:USER_TO_CUSTOMER]->(c:Customer)-[r3:HAS_CUST_STATE]->(cs:Customer_State)
    WHERE r3.to IS NULL
    RETURN collect({ cust_id: cs.cust_id, cust_acc_until: toString(cs.cust_acc_until), cust_gtc_accepted: toString(cs.cust_gtc_accepted), user_is_cust_admin: r2.user_is_cust_admin, user_to: toString(r2.to) } ) AS cust_states }
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
  user_pwd: us.user_pwd,
  user_gdpr_accepted: toString(us.user_gdpr_accepted),
  user_surf_lang: l1.iso_639_1,
  user_1st_lang: l2.iso_639_1,
  user_2nd_lang: l3.iso_639_1,
  user_pref_country: cou.iso_3166_1_alpha_2,
  cust_states: cust_states,
  user_NL_state: user_NL_state,
  user_addresses: user_addresses
} AS User;`;

module.exports = async (object, params, ctx, info) => {
  let session = driver.session();
  let loginStatus = false;
  let loginFailedCode = null;
  try {
    const result = await session.run(query, params);
    const userState = result.records.map((record) => {
      return record.get('userState').properties;
    });

    if (userState && userState[0]) {
      // if (!auth.comparePassword(userState[0].user_pwd, params.password)) {
      if (userState[0].user_pwd !== params.password) {
        // Log invalid password query
        await session.run(getCommonLogginQuery('log_par_01: $email'), {
          type: constants.LOG_TYPE_ID.LOGIN_WITH_WRONG_PASSWORD,
          ...params,
        });
        throw new Error(common.getMessage('INVALID_LOGIN_PASSWORD'));
      }
      const userStateInformation = await session.run(getUserStateInformationQUery, params).then((result) => {
        if (result && result.records) {
          const singleRecord = result.records[0];
          return singleRecord.get(0);
        }
        throw new Error(common.getMessage('INVALID_LOGIN_EMAIL'));
      });
      const userSurfLang = userStateInformation.user_surf_lang;
      const customerStates = userStateInformation['cust_states'];
      if (customerStates && customerStates.length > 0) {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        let userToCustomerValidTo = _.filter(customerStates, (state) => {
          if (state.user_to) {
          return state;
          }
        });
        if (userToCustomerValidTo.length === 0) {
          await session.run(getCommonLogginQuery(), { type: constants.LOG_TYPE_ID.USER_ACCOUNT_EXPIRED, ...params });
          throw new Error(common.getMessage('USER_ACCOUNT_EXPIRED', userSurfLang));
        }

        let validUserToCustomer = _.filter(userToCustomerValidTo, (o) => {
          if (new Date(o.cust_acc_until) >= currentDate) {
          return o;
          }
        });
        if (validUserToCustomer.length === 0) {
          await session.run(getCommonLogginQuery(), { type: constants.LOG_TYPE_ID.CUSTOMER_LINKED_ACCOUNT_EXPIRED, ...params });
          throw new Error(common.getMessage('CUSTOMER_LINKED_ACCOUNT_EXPIRED', userSurfLang));
        }

        let validGTCAcceptedCustomer = _.filter(validUserToCustomer, (customer) => {
          if (customer.cust_gtc_accepted) return customer;
        });
        if (validGTCAcceptedCustomer.length === 0) {
          let userToCustomerAdmin = _.filter(validUserToCustomer, (o) => {
            if (o.user_is_cust_admin) return o;
          });
          if (userToCustomerAdmin.length > 0) {
            loginFailedCode = constants.LOGIN_FAILED_STATUS.GTC_NOT_ACCEPTED;
            return {
              loginStatus,
              loginFailedCode,
              loginMessage: common.getMessage(loginFailedCode, userSurfLang),
              user: null,
              lang: userSurfLang,
              token: auth.generateToken({
                login_status: loginStatus,
                login_failed_code: loginFailedCode,
                user_id: userStateInformation.user_id,
                user_email: userStateInformation.user_email,
                user_surf_lang: userSurfLang,
              }),
            };
          }
          // Log for GTC not accepted user
          // await session.run(getCommonLogginQuery(), { type: constants.LOG_TYPE_ID., ...params });
          // throw new Error(common.getMessage('GTC_NOT_ACCEPTED', userSurfLang));
        }
      }
      if (!userStateInformation.user_gdpr_accepted) {
        loginFailedCode = constants.LOGIN_FAILED_STATUS.GDPR_NOT_ACCEPTED;
        return {
          loginStatus,
          loginFailedCode,
          loginMessage: common.getMessage(loginFailedCode, userSurfLang),
          user: null,
          lang: userSurfLang,
          token: auth.generateToken({
            login_status: loginStatus,
            login_failed_code: loginFailedCode,
            user_id: userStateInformation.user_id,
            user_email: userStateInformation.user_email,
            user_surf_lang: userSurfLang,
          }),
        };
      }
      // Log success login query
      await session.run(getCommonLogginQuery(), {
        type: constants.LOG_TYPE_ID.LOGIN_SUCCESS,
        ...params,
      });
      loginStatus = true;
      session.close();
      return {
        loginStatus,
        loginFailedCode,
        loginMessage: common.getMessage('LOGIN_SUCCESS', userSurfLang),
        lang: userSurfLang,
        user: userStateInformation,
        token: auth.generateToken({
          login_status: true,
          login_failed_code: loginFailedCode,
          user_id: userStateInformation.user_id,
          user_email: userStateInformation.user_email,
          user_surf_lang: userSurfLang,
          user_pref_country: userStateInformation.user_pref_country,
        }),
      };
    }
    // Log invalid email query
    await session.run(logInvalidEmailQuery, { type: constants.LOG_TYPE_ID.LOGIN_WITH_WRONG_CREDENTIALS, ...params });
    throw new Error(common.getMessage('INVALID_LOGIN_EMAIL'));
  } catch (error) {
    session.close();
    throw error;
  }
};
