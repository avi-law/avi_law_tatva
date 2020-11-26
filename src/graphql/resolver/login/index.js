const { now } = require('lodash');
const _ = require('lodash');
const driver = require('../../../config/db');
const { constants, auth } = require('../../../utils');

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

const getUserStatusInformationQuery = `
MATCH (us:User_State {user_email: $email })<-[r1:HAS_USER_STATE]-(u:User)
WHERE r1.to IS NULL
Call { With u MATCH(u:User)-[r2:USER_TO_CUSTOMER]->(c:Customer)-[r3:HAS_CUST_STATE]->(cs:Customer_State)
  WHERE r3.to IS NULL
  RETURN collect({ cust_id: cs.cust_id, cust_acc_until: toString(cs.cust_acc_until), cust_gtc_accepted: toString(cs.cust_gtc_accepted), user_is_cust_admin: r2.user_is_cust_admin, user_to: toString(r2.to) } ) AS cust_states
}
MATCH (us)-[r4:USER_HAS_PREF_SURF_LANG]->(l1:Language)
WHERE r4.to IS NULL
MATCH (us)-[r5:USER_HAS_PREF_1ST_LANG]->(l2:Language)
WHERE r5.to IS NULL
MATCH (us)-[r6:USER_HAS_PREF_2ND_LANG]->(l3:Language)
WHERE r6.to IS NULL
MATCH (us)-[r7:USER_HAS_PREF_COUNTRY]->
(cou:Country)
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
  cust_states: cust_states
} AS User;`;

module.exports = (object, params) => {
  let session = driver.session();
  return session
    .run(query, params)
    .then((result) => {
      return result.records.map((record) => {
        return record.get('userState').properties;
      });
    })
    .then(async (userState) => {
      if (userState && userState[0]) {
        // if (!auth.comparePassword(userState[0].user_pwd, params.password)) {
        if (userState[0].user_pwd !== params.password) {
          // Log invalid password query
          await session.run(getCommonLogginQuery('log_par_01: $email'), {
            type: constants.LOG_TYPE_ID.LOGIN_WITH_WRONG_PASSWORD,
            ...params,
          });
          throw new Error(constants.ERROR.INVALID_LOGIN_PASSWORD);
        }
        return session.run(getUserStatusInformationQuery, params).then((result) => {
          if (result && result.records) {
            const singleRecord = result.records[0];
            return singleRecord.get(0);
          }
          throw new Error(constants.ERROR.INVALID_LOGIN_EMAIL);
        });
      }
      // Log invalid email query
      await session.run(logInvalidEmailQuery, { type: constants.LOG_TYPE_ID.LOGIN_WITH_WRONG_CREDENTIALS, ...params });
      throw new Error(constants.ERROR.INVALID_LOGIN_EMAIL);
    })
    .then(async (successResponse) => {
      const customerStates = successResponse['cust_states'];
      if (customerStates && customerStates.length > 0) {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        let validUserToCustomer = _.filter(customerStates, (o) => {
          if (new Date(o.cust_acc_until) >= currentDate) return o;
        });
        if (validUserToCustomer.length === 0) {
          await session.run(getCommonLogginQuery(), { type: constants.LOG_TYPE_ID.CUSTOMER_LINKED_ACCOUNT_EXPIRED, ...params });
          throw new Error(constants.ERROR.CUSTOMER_LINKED_ACCOUNT_EXPIRED);
        }
        let userToCustomerValidTo = _.filter(customerStates, (state) => {
          if (state.user_to) {
            return state;
          }
        });
        if (userToCustomerValidTo.length === 0) {
          await session.run(getCommonLogginQuery(), { type: constants.LOG_TYPE_ID.USER_ACCOUNT_EXPIRED, ...params });
          throw new Error(constants.ERROR.USER_ACCOUNT_EXPIRED);
        }
      }
      // Log success login query
      await session.run(getCommonLogginQuery(), {
        type: constants.LOG_TYPE_ID.LOGIN_SUCCESS,
        ...params,
      });
      return {
        User: successResponse,
        token: auth.generateToken(successResponse),
      };
    })
    .finally(() => {
      session.close();
    });
};
