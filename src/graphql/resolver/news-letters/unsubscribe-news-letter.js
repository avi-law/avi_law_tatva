/* eslint-disable consistent-return */
const jwt = require("jsonwebtoken");
const driver = require("../../../config/db");
const { APIError } = require("../../../utils");
const {
  defaultLanguage,
  jwtSecret,
  jwtAlgorithms,
} = require("../../../config/application");
const { unsubscribeNLForUser } = require("../../../neo4j/query");

module.exports = async (object, params) => {
  const { token } = params;
  const session = driver.session();
  let decoded;
  try {
    if (!token) {
      return false;
    }
    try {
      decoded = jwt.verify(token, jwtSecret, {
        algorithms: [jwtAlgorithms],
      });
    } catch (err) {
      throw new APIError({
        lang: defaultLanguage,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const { email } = decoded;
    const result = await session.run(unsubscribeNLForUser, {
      user_email: email,
    });
    if (result && result.records.length > 0) {
      session.close();
      return true;
    }
    throw new APIError({
      lang: defaultLanguage,
      message: "INTERNAL_SERVER_ERROR",
    });
  } catch (error) {
    session.close();
    throw error;
  }
};
