const driver = require('../../../config/db');
const constants = require('../../../utils/constants');

const query = `
MATCH (us:User_State)<-[r1:HAS_USER_STATE]-()
WHERE us.user_email = $email AND r1.to IS NULL
RETURN us as userState
LIMIT 1;`;

const logInvalidEmailQuery = `
MATCH (n:Log_Type { log_type_id: $type } )
MERGE(:Log { log_timestamp: apoc.date.currentTimestamp(), log_par_01: $email, log_par_02: $password })-[:HAS_LOG_TYPE]-> (n);`;

const logInvalidPasswordQuery = `
MATCH (a: Log_Type { log_type_id: $type })
MATCH (b:User)-[HAS_USER_STATE]->(:User_State { user_email: $email } )
MERGE (b)<-[:LOG_FOR_USER]-(:Log { log_timestamp: apoc.date.currentTimestamp(), log_par_01: $email })-[:HAS_LOG_TYPE]->(a);`;

const logSuccessLoginQuery = `
MATCH (a: Log_Type {log_type_id: $type } )
MATCH (b:User)-[HAS_USER_STATE]->(:User_State { user_email: $email } )
MERGE (b)<-[:LOG_FOR_USER]-(:Log { log_timestamp: apoc.date.currentTimestamp() })-[:HAS_LOG_TYPE]->(a);`;

const getUserStatusInformationQuery = `
MATCH (us:User_State { user_email: $email } )<-[r1:HAS_USER_STATE]-(u:User)-[r2:USER_TO_CUSTOMER]->(c:Customer)-[r3:HAS_CUST_STATE]->(cs:Customer_State)
WHERE r1.to IS NULL AND r2.to IS NULL AND r3.to IS NULL
RETURN {
  user_email: us.user_email,
  user_pwd: us.user_pwd,
  user_gdpr_accepted: us.user_gdpr_accepted,
  user: [ {
    user_id: u.user_id,
    user_to_customer: {
      user_is_cust_admin: r2.user_is_cust_admin,
      customer_state: {
        cust_acc_until: cs.cust_acc_until,
        cust_gtc_accepted: cs.cust_gtc_accepted
      }
    }
  } ]
} as user_state;`;

module.exports = (_, params) => {
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
        if (userState[0].user_pwd !== params.password) {
          // Log invalid password query
          await session.run(logInvalidPasswordQuery, {
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
      // Log success login query
      await session.run(logInvalidPasswordQuery, {
        type: constants.LOG_TYPE_ID.LOGIN_SUCCESS,
        ...params,
      });
      return successResponse;
    })
    .finally(() => {
      session.close();
    });
};
