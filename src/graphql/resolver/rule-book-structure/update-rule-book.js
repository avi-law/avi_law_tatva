/* eslint-disable no-param-reassign */

const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  getRuleBookById,
  updateRuleBookQuery,
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
  const { data } = params;
  const ruleBookId = params.rule_book_id;
  try {
    if (!systemAdmin && !userIsAuthor) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const queryParams = {
      ruleBookId,
      rb: data.rb,
    };
    console.log(queryParams);
    console.log(updateRuleBookQuery(queryParams));
    return false;
    const result = await session.run(updateRuleBookQuery(queryParams), {
      queryParams,
    });
    if (result && result.records.length > 0) {
      /**
       const rulebooks = result.records.map((record) => {
        const rulebookResult = {
          ...common.getPropertiesFromRecord(record, "rb"),
        };
        return rulebookResult;
      });
      common.loggingData(logRulebook, {
        type: constants.LOG_TYPE_ID.UPDATE_RULE_BOOK,
        current_user_email: userEmail,
        rule_book_id: rulebooks[0].rule_book_id || null,
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
