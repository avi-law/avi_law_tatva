/* eslint-disable no-param-reassign */

const _ = require("lodash");
const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  addRuleElementQuery,
  logRuleElement,
} = require("../../../neo4j/rule-element-query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const systemAdmin = user.user_is_sys_admin || null;
  const userIsAuthor = user.user_is_author || null;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userEmail = user.user_email || null;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const { data } = params;
  try {
    if (!systemAdmin && !userIsAuthor) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const queryParams = {
      re: data.re,
    };
    if (data.rule_element_parent_doc_id) {
      queryParams.rule_element_parent_doc_id = data.rule_element_parent_doc_id;
    } else if (data.rule_book_issue_no && data.rule_book_id) {
      queryParams.rule_book_issue_no = data.rule_book_issue_no;
      queryParams.rule_book_id = data.rule_book_id;
    }
    queryParams.rule_element_order = _.get(data, "rule_element_order", 10);
    console.log(queryParams);
    console.log(addRuleElementQuery(queryParams));
    // return true;
    const result = await session.run(addRuleElementQuery(queryParams), {
      queryParams,
    });
    if (result && result.records.length > 0) {
      const ruleElement = result.records.map((record) => {
        const ruleElementResult = {
          ...common.getPropertiesFromRecord(record, "re"),
        };
        return ruleElementResult;
      });
      common.loggingData(logRuleElement, {
        type: constants.LOG_TYPE_ID.CREATE_RULE_ELEMENT_AND_STATE,
        current_user_email: userEmail,
        rule_element_doc_id: ruleElement[0].rule_element_doc_id || null,
      });
      return true;
    }
    throw new APIError({
      lang: userSurfLang,
      message: "INTERNAL_SERVER_ERROR",
    });
  } catch (error) {
    session.close();
    throw error;
  } finally {
    session.close();
  }
};
