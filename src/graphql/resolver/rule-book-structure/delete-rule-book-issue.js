/* eslint-disable no-param-reassign */

const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  deleteRuleBookIssueQuery,
  logRulebook,
} = require("../../../neo4j/rule-book-query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const systemAdmin = user.user_is_sys_admin || null;
  const userIsAuthor = user.user_is_author || null;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userEmail = user.user_email || null;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const ruleBookIssueNo = params.rule_book_issue_no;
  const ruleBookParentId = params.rule_book_parent_id;
  try {
    if (!systemAdmin && !userIsAuthor) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    if (!ruleBookParentId && !Number(ruleBookIssueNo) > 0) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const queryParams = {
      ruleBookIssueNo,
      ruleBookParentId,
    };
    console.log(deleteRuleBookIssueQuery(queryParams));
    return true;
    // const result = await session.run(deleteRuleBookIssueQuery(queryParams), {
    //   queryParams,
    // });
    if (result && result.records.length > 0) {
      /**
       const rulebooks = result.records.map((record) => {
        const rulebookResult = {
          ...common.getPropertiesFromRecord(record, "rbs"),
        };
        return rulebookResult;
      });
      common.loggingData(logRulebook, {
        type: constants.LOG_TYPE_ID.DELETE_RULE_BOOK_STRUCT,
        current_user_email: userEmail,
        rule_book_id: ruleBookId || null,
      });
      */
      return true;
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
