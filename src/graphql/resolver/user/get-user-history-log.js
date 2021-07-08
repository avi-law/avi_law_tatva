/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { APIError } = require("../../../utils");
const {
  getUserHistoryLogs,
  getUserHistoryLogsCount,
} = require("../../../neo4j/user-query");
const { defaultLanguage } = require("../../../config/application");

module.exports = async (object, params, ctx) => {
  params = JSON.parse(JSON.stringify(params));
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userEmail = user.user_email || null;
  const session = driver.session();
  let logData = null;
  let total = 0;
  const offset = params.offset || 0;
  const limit = params.first || 20;
  try {
    if (!userEmail) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const countResult = await session.run(getUserHistoryLogsCount, {
      user_email: userEmail,
    });
    if (countResult && countResult.records.length > 0) {
      const singleRecord = countResult.records[0];
      total = singleRecord.get("count");
    }
    const result = await session.run(getUserHistoryLogs, {
      user_email: userEmail,
      limit,
      skip: offset,
    });

    if (result && result.records.length > 0) {
      result.records.forEach((record) => {
        const logs = record.get("logs");
        logs.forEach((element) => {
          const data = {
            en: null,
            de: null,
          };
          data.de = _.filter(element.data, {
            iso_639_1: "de",
          });
          data.en = _.filter(element.data, {
            iso_639_1: "en",
          });
          data.en = _.orderBy(data.en, ["rule_element_doc_id"], ["asc"]);
          data.de = _.orderBy(data.de, ["rule_element_doc_id"], ["asc"]);
          element.data = JSON.stringify(data);
        });
        logData = logs;
      });
    }
    // console.log(logData);
    // if (logData.data) {
    //   const lData = await getLogData(logData);
    //   logData.data = JSON.stringify(lData);
    // }
    logData.total = total;
    return logData;
  } catch (error) {
    session.close();
    throw error;
  } finally {
    session.close();
  }
};
