/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const {
  getRuleElementStateList,
} = require("../../../neo4j/rule-element-query");
const { defaultLanguage } = require("../../../config/application");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userEmail = user ? user.user_email : null;
  const systemAdmin = user.user_is_sys_admin || null;
  const userIsAuthor = user.user_is_author || null;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const ruleElementDocId = params.rule_element_doc_id;
  const ruleElementStateList = [];
  try {
    if ((!systemAdmin && !userIsAuthor) || !ruleElementDocId) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const result = await session.run(getRuleElementStateList, {
      rule_element_doc_id: ruleElementDocId,
    });
    if (result && result.records.length > 0) {
      const ruleElement = result.records.map((record) => {
        const res = {};
        if (record.get("res") && record.get("res").length > 0) {
          record.get("res").forEach((reState) => {
            if (
              reState.lang &&
              reState.res &&
              reState.lang.properties.iso_639_1
            ) {
              const properties = _.get(reState, "res.properties", null);
              if (properties) {
                if (properties.rule_element_title !== "") {
                  properties.rule_element_title = common.removeTag(
                    properties.rule_element_title
                  );
                }
                if (!res[properties.rule_element_id]) {
                  res[properties.rule_element_id] = {};
                }
                res[properties.rule_element_id][
                  reState.lang.properties.iso_639_1
                ] = properties;
              }
            }
          });
        }
        if (res && Object.keys(res).length > 0) {
          Object.keys(res).forEach((e) => {
            ruleElementStateList.push(res[e]);
          });
        }
        const reResult = {
          re: common.getPropertiesFromRecord(record, "re"),
          res: ruleElementStateList,
        };
        return reResult;
      });
      return ruleElement[0];
    }
    return null;
  } catch (error) {
    session.close();
    throw error;
  } finally {
    session.close();
  }
};
