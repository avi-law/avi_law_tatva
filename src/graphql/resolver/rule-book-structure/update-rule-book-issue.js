/* eslint-disable no-param-reassign */

const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  getRuleBookStructById,
  updateRuleBookIssueQuery,
  logRulebookStruct,
} = require("../../../neo4j/rule-book-query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const systemAdmin = user.user_is_sys_admin || null;
  const userIsAuthor = user.user_is_author || null;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userEmail = user.user_email || null;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  let isValidDE = false;
  let isValidEN = false;
  const { data } = params;
  const ruleBookIssueNo = data.rule_book_issue_no;
  try {
    if (!systemAdmin && !userIsAuthor) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    if (data.rbis && data.rbis.de && data.rbis.de.rule_book_issue_title_short) {
      isValidDE = true;
    }
    if (data.rbis && data.rbis.en && data.rbis.en.rule_book_issue_title_short) {
      isValidEN = true;
    }

    const queryParams = {
      ruleBookIssueNo,
      rbi: data.rbi,
      rbis: data.rbis,
      rule_book_parent_id: data.rule_book_parent_id,
      isValidDE,
      isValidEN,
    };
    if (data.sl_tags && data.sl_tags.length > 0) {
      queryParams.sl_tags = data.sl_tags;
    }
    console.log(updateRuleBookIssueQuery(queryParams));
    return true;
    // const result = await session.run(updateRuleBookIssueQuery(queryParams), {
    //   queryParams,
    // });
    if (result && result.records.length > 0) {
      /**
       const rulebookStructs = result.records.map((record) => {
        const rulebookStructResult = {
          ...common.getPropertiesFromRecord(record, "rbs"),
        };
        return rulebookStructs;
      });
      common.loggingData(logRulebookStruct, {
        type: constants.LOG_TYPE_ID.CREATE_RULE_BOOK,
        current_user_email: userEmail,
        rule_book_struct_id: rulebookStructs[0].rule_book_struct_id || null,
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
