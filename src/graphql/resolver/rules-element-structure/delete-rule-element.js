/* eslint-disable no-param-reassign */
const _ = require("lodash");
const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  deleteRuleElement,
  logDeleteRuleElementAndState,
} = require("../../../neo4j/rule-element-query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const systemAdmin = user.user_is_sys_admin || null;
  const userIsAuthor = user.user_is_author || null;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userEmail = user.user_email || null;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const ruleElementDocId = params.rule_element_doc_id;
  const ruleBookId = _.get(params, "rule_book_id", null);
  const ruleBookIssueNo = _.get(params, "rule_book_issue_no", null);
  const ruleElementDocParentId = _.get(
    params,
    "rule_element_parent_doc_id",
    null
  );
  try {
    if (!systemAdmin && !userIsAuthor) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    if (!ruleElementDocId) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const queryParams = {
      rule_element_doc_id: ruleElementDocId,
      ruleBookId,
      ruleBookIssueNo,
      ruleElementDocParentId,
    };
    console.log(queryParams);
    console.log(deleteRuleElement(queryParams));
    // return true;
    const result = await session.run(deleteRuleElement(queryParams), {
      queryParams,
    });
    if (result && result.records.length > 0) {
      const ruleElement = result.records.map((record) => {
        const ruleElementResult = {
          ...common.getPropertiesFromRecord(record, "re"),
        };
        return ruleElementResult;
      });
      common.loggingData(logDeleteRuleElementAndState, {
        type: constants.LOG_TYPE_ID.DELETE_RULE_ELEMENT_AND_STATE,
        current_user_email: userEmail,
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
