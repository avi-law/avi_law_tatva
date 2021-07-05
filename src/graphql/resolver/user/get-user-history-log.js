/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { APIError, constants, common } = require("../../../utils");
const { getUserHistoryLogs } = require("../../../neo4j/user-query");
const {
  getLogRefersToRuleElementStateDetails,
} = require("../../../neo4j/rule-element-query");
const { defaultLanguage } = require("../../../config/application");

const getRuleElementStateData = async (ruleElementState) => {
  const session = driver.session();
  try {
    const identity = _.get(ruleElementState, "identity", null);
    if (identity) {
      const ruleStatResultDetails = await session.run(
        getLogRefersToRuleElementStateDetails,
        {
          array_of_identity: [identity],
        }
      );
      const stateObject = {
        re: null,
        rbis: null,
        res: {
          en: null,
          de: null,
        },
      };
      if (ruleStatResultDetails && ruleStatResultDetails.records.length > 0) {
        ruleStatResultDetails.records.forEach((record) => {
          const stateIdentity = record.get("res1").identity || null;
          const res1 = common.getPropertiesFromRecord(record, "res1");
          const lang1 = common.getPropertiesFromRecord(record, "lang1");
          const res2 = common.getPropertiesFromRecord(record, "res2");
          const lang2 = common.getPropertiesFromRecord(record, "lang2");
          stateObject.rbis = record.get("rbis");
          stateObject.re = common.getPropertiesFromRecord(record, "re");
          if (res1 && lang1) {
            stateObject.res[lang1.iso_639_1] = res1;
            stateObject.res[lang1.iso_639_1].identity = stateIdentity;
          }
          if (res2 && lang2) {
            stateObject.res[lang2.iso_639_1] = res2;
            stateObject.res[lang2.iso_639_1].identity = stateIdentity;
          }
        });
      }
      return stateObject;
    }
    return null;
  } catch (error) {
    session.close();
    throw error;
  } finally {
    session.close();
  }
};

const getLogData = (logs) => {
  let data = null;
  const logTypeId = _.get(logs, "lt.log_type_id", null);
  switch (logTypeId) {
    case constants.LOG_TYPE_ID.READ_RULE_ELEMENT_AND_STATE:
      data = getRuleElementStateData(logs.data);
      break;
    default:
      break;
  }
  return data;
};

module.exports = async (object, params, ctx) => {
  params = JSON.parse(JSON.stringify(params));
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userEmail = user.user_email || null;
  const session = driver.session();
  let logData = null;
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
      result.records.forEach((record) => {
        const logs = record.get("logs");
        logData = logs;
      });
    }
    if (logData.data) {
      const lData = await getLogData(logData);
      logData.data = JSON.stringify(lData);
    }
    return logData;
  } catch (error) {
    session.close();
    throw error;
  } finally {
    session.close();
  }
};
