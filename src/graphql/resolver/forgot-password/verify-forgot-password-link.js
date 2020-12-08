/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { getUserByToken } = require("../../../neo4j/query");

module.exports = async (object, params) => {
  const { token } = params;
  const session = driver.session();
  let valid = false;
  let user;
  try {
    if (!token) {
      return valid;
    }
    const result = await session.run(getUserByToken, { token });
    if (result && result.records.length === 0) {
      throw new APIError({
        lang: defaultLanguage,
        message: "INVALID_FORGOT_PASSWORD_LINK",
      });
    }
    const currentDate = Date.now();
    const singleRecord = result.records[0];
    user = singleRecord.get(0).properties;
    if (user.reset_pwd_token_expiry_date >= currentDate) {
      valid = true;
    }
    return valid;
  } catch (error) {
    session.close();
    throw error;
  }
};
