/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { common, APIError } = require("../../../utils");
const { getUser } = require("../../../neo4j/query");
const { defaultLanguage } = require("../../../config/application");

module.exports = async (object, params, ctx) => {
  params = JSON.parse(JSON.stringify(params));
  const email = params.user_email;
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const session = driver.session();
  try {
    const result = await session.run(getUser, { user_email: email });
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
      lang: userSurfLang,
      message: "INVALID_FORGOT_PASSWORD",
    });
  } catch (error) {
    session.close();
    throw error;
  }
};
