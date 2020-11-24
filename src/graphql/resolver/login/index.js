const driver = require('../../../config/db');
const constants = require('../../../utils/constants');

const query = 'MATCH (n:User_State) WHERE n.user_email = $email RETURN n LIMIT 1;';

const logInvalidEmailQuery = `
MATCH (n:Log_Type { log_type_id: $type } )
MERGE(:Log { log_timestamp: apoc.date.currentTimestamp(), log_par_01: $email, log_par_02: $password })-[:HAS_LOG_TYPE]-> (n);`;

const logInvalidPasswordQuery = `
MATCH (a: Log_Type { log_type_id: $type })
MATCH (b:User)-[HAS_USER_STATE]->(:User_State { user_email: $email } )
MERGE (b)<-[:LOG_FOR_USER]-(:Log { log_timestamp: apoc.date.currentTimestamp(), log_par_01: $email })-[:HAS_LOG_TYPE]->(a);`;

module.exports = (_, params) => {
  let session = driver.session();
  return session
    .run(query, params)
    .then((result) => {
      return result.records.map((record) => {
        return record.get('n').properties;
      });
    })
    .then(async (userState) => {
      if (userState && userState[0]) {
        if (userState[0].user_pwd !== params.password) {
          await session.run(logInvalidPasswordQuery, {
            type: constants.LOG_TYPE_ID.LOGIN_WITH_WRONG_PASSWORD,
            ...params,
          });
          throw new Error(constants.ERROR.INVALID_LOGIN_PASSWORD);
        }
        return userState[0];
      }
      await session.run(logInvalidEmailQuery, { type: constants.LOG_TYPE_ID.LOGIN_WITH_WRONG_CREDENTIALS, ...params });
      throw new Error(constants.ERROR.INVALID_LOGIN_EMAIL);
    })
    .finally(() => {
      session.close();
    });
};
