/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { APIError, common } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  getRuleElementStateDetails,
} = require("../../../neo4j/rule-element-query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const systemAdmin = user.user_is_sys_admin || null;
  const userIsAuthor = user.user_is_author || null;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const { identity } = params;
  const ruleElementDocId = params.rule_element_doc_id;
  try {
    if (!systemAdmin && !userIsAuthor) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const ruleStatResultDetails = await session.run(
      getRuleElementStateDetails,
      {
        rule_element_doc_id: ruleElementDocId,
        array_of_identity: identity,
      }
    );
    const stateObject = {
      en: null,
      de: null,
    };
    if (ruleStatResultDetails && ruleStatResultDetails.records.length > 0) {
      ruleStatResultDetails.records.forEach((record) => {
        const stateIdentity = record.get("res").identity || null;
        const res = common.getPropertiesFromRecord(record, "res");
        const lang = common.getPropertiesFromRecord(record, "lang");
        const sol = common.getPropertiesFromRecord(record, "sl");
        if (res && lang) {
          stateObject[lang.iso_639_1] = res;
          stateObject[lang.iso_639_1].sol = sol;
          stateObject[lang.iso_639_1].identity = stateIdentity;
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
