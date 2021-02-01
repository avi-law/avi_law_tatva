/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { getUserByEmailVerificationToken } = require("../../../neo4j/query");

module.exports = async (object, params) => {
  const { token } = params;
  const session = driver.session();
  try {
    if (!token) {
      return false;
    }
    const result = await session.run(getUserByEmailVerificationToken, {
      token,
    });
    if (result && result.records.length === 0) {
      throw new APIError({
        lang: defaultLanguage,
        message: "INVALID_EMAIL_VERIFICATION_LINK",
      });
    }
    session.close();
    return true;
  } catch (error) {
    session.close();
    throw error;
  }
};
