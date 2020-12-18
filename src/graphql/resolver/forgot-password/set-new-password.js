/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError, auth } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  getUserByToken,
  resetUserPassword,
  cloneForgotPasswordUserState,
} = require("../../../neo4j/query");

module.exports = async (object, params) => {
  const { token } = params;
  const userPassword = params.user_pwd;
  const session = driver.session();
  let user;
  try {
    const result = await session.run(getUserByToken, { token });
    if (result && result.records.length === 0) {
      throw new APIError({
        lang: defaultLanguage,
        message: "INVALID_FORGOT_PASSWORD_LINK",
      });
    }
    const userEmail = result.records.map((record) => record.get("userEmail"));
    const currentDate = Date.now();
    const singleRecord = result.records[0];
    user = singleRecord.get(0).properties;
    if (user.reset_pwd_token_expiry_date < currentDate) {
      throw new APIError({
        lang: defaultLanguage,
        message: "INVALID_FORGOT_PASSWORD_LINK",
      });
    }
    const encryptedPassword = await auth.hashPassword(userPassword);
    return session
      .run(cloneForgotPasswordUserState, {
        user_email: userEmail[0],
      })
      .then(() => {
        session
          .run(resetUserPassword, {
            user_email: userEmail[0],
            user_pwd: encryptedPassword,
          })
          .then((setPasswordResult) => {
            if (setPasswordResult && setPasswordResult.records.length > 0) {
              return true;
            }
            throw new APIError({
              lang: defaultLanguage,
              message: "INVALID_FORGOT_PASSWORD_LINK",
            });
          });
      })
      .catch((err) => {
        throw err;
      });
  } catch (error) {
    session.close();
    throw error;
  }
};
