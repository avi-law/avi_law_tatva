/* eslint-disable dot-notation */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { APIError, common } = require("../../../utils");
const { getAMCGMRuleElement } = require("../../../neo4j/rule-element-query");
const { defaultLanguage } = require("../../../config/application");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const systemAdmin = user.user_is_sys_admin || null;
  const userIsAuthor = user.user_is_author || null;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const ruleElementDocId = params.rule_element_doc_id;
  const { identity } = params;
  const response = { re: null, amc: null, gm: null, cs: null };
  try {
    if (!systemAdmin && !userIsAuthor) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const result = await session.run(getAMCGMRuleElement, {
      rule_element_doc_id: ruleElementDocId,
      identity,
    });
    if (result && result.records.length > 0) {
      result.records.forEach((record) => {
        const re = common.getPropertiesFromRecord(record, "re");
        response.re = re;
        response.amc = record.get("amc");
        response.gm = record.get("gm");
        response.cs = record.get("cs");
      });
    }
    return response;
  } catch (error) {
    session.close();
    throw error;
  } finally {
    session.close();
  }
};
