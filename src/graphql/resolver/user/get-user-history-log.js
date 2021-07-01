/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { common, APIError } = require("../../../utils");
const { getUserHistoryLogs } = require("../../../neo4j/user-query");
const { defaultLanguage } = require("../../../config/application");

module.exports = async (object, params, ctx) => {
  params = JSON.parse(JSON.stringify(params));
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userEmail = user.user_email || null;
  const session = driver.session();
  try {
    if (!userEmail) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const result = await session.run(getUserHistoryLogs, {
      user_email: userEmail,
    });

    if (result && result.records.length > 0) {
      let logData = null;
      result.records.forEach((record, index) => {
        const logs = record.get("logs");
        if (logs.data) {
          logs.data = JSON.stringify(logs.data);
        }
        logData = logs;
      });
      return logData;
    }
    throw new APIError({
      lang: userSurfLang,
      message: "INTERNAL_SERVER_ERROR",
    });
  } catch (error) {
    session.close();
    throw error;
  }
};
