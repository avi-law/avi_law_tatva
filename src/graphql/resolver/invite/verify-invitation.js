/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError, common } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { getUserByInvitationToken } = require("../../../neo4j/query");

module.exports = async (object, params) => {
  const { token } = params;
  const session = driver.session();
  try {
    if (!token) {
      throw new APIError({
        lang: defaultLanguage,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const result = await session.run(getUserByInvitationToken, { token });
    if (result && result.records.length > 0) {
      const userData = result.records.map((record) => {
        const userResult = {
          user: common.getPropertiesFromRecord(record, "u"),
          user_state: common.getPropertiesFromRecord(record, "us"),
          lang1: common.getPropertiesFromRecord(record, "lang1"),
          lang2: common.getPropertiesFromRecord(record, "lang2"),
          lang3: common.getPropertiesFromRecord(record, "lang3"),
          cou1: common.getPropertiesFromRecord(record, "cou1"),
          cou3: record.get("cou3"),
        };
        return userResult;
      });
      return userData[0];
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
