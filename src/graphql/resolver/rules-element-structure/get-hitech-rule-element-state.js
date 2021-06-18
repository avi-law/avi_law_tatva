/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  getHitechRuleElementStateDetails,
} = require("../../../neo4j/rule-element-query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userIsHitech = user.user_is_hitech || false;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const { identity } = params;
  try {
    if (!userIsHitech) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const ruleStatResultDetails = await session.run(
      getHitechRuleElementStateDetails,
      {
        identity,
      }
    );
    const stateObject = {
      en: null,
      de: null,
    };
    if (ruleStatResultDetails && ruleStatResultDetails.records.length > 0) {
      ruleStatResultDetails.records.forEach((record) => {
        const res1 = record.get("res1");
        const res2 = record.get("res2");
        if (res1.res && res1.lang.iso_639_1) {
          stateObject[res1.lang.iso_639_1] = res1.res.properties;
          stateObject[res1.lang.iso_639_1].identity = res1.res.identity;
        }
        if (res2.res && res2.lang.iso_639_1) {
          stateObject[res2.lang.iso_639_1] = res2.res.properties;
          stateObject[res2.lang.iso_639_1].identity = res2.res.identity;
        }
        return stateObject;
      });
    }
    return { res: stateObject };
  } catch (error) {
    session.close();
    throw error;
  } finally {
    session.close();
  }
};
