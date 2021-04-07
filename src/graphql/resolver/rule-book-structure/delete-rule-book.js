/* eslint-disable no-param-reassign */

const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  getRuleBookById,
  deleteRuleBookQuery,
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
  const ruleBookId = params.rule_book_id;
  const ruleBookStructParentId = params.rule_book_struct_parent_id;
  const ruleBookParentId = params.rule_book_parent_id;
  try {
    if (!systemAdmin && !userIsAuthor) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    if (!ruleBookParentId && !ruleBookStructParentId) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    if (ruleBookId && ruleBookStructParentId) {
      const checkExistRuleBook = await session.run(getRuleBookById, {
        rule_book_id: ruleBookId,
      });
      if (checkExistRuleBook && checkExistRuleBook.records.length === 0) {
        console.log("Does not exists rule book");
        throw new APIError({
          lang: userSurfLang,
          message: "INTERNAL_SERVER_ERROR",
        });
      }
    }
    const queryParams = {
      ruleBookId,
      ruleBookStructParentId,
      ruleBookParentId,
    };
    console.log(queryParams);
    console.log(deleteRuleBookQuery(queryParams));
    return false;
    const result = await session.run(deleteRuleBookQuery(queryParams), {
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
        type: constants.LOG_TYPE_ID.DELETE_RULE_BOOK,
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
