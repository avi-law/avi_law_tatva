/* eslint-disable no-param-reassign */

const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  getRuleBookStructById,
  deleteRuleBookStructQuery,
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
  const ruleBookStructId = params.rule_book_struct_id;
  const ruleBookStructParentId = params.rule_book_struct_parent_id;
  try {
    if (!systemAdmin && !userIsAuthor) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    if (
      !ruleBookStructId &&
      !ruleBookStructParentId &&
      ruleBookStructId === constants.RULE_BOOK_STRUCT_ROOT_ID
    ) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    if (ruleBookStructId && ruleBookStructParentId) {
      const checkExistRuleBookStruct = await session.run(
        getRuleBookStructById,
        {
          rule_book_struct_id: ruleBookStructId,
        }
      );
      if (
        checkExistRuleBookStruct &&
        checkExistRuleBookStruct.records.length === 0
      ) {
        console.log("Does not exists rule book struct");
        throw new APIError({
          lang: userSurfLang,
          message: "INTERNAL_SERVER_ERROR",
        });
      }
    }
    const queryParams = {
      ruleBookStructId,
      ruleBookStructParentId,
    };
    console.log(queryParams);
    console.log(deleteRuleBookStructQuery(queryParams));
    return false;
    const result = await session.run(deleteRuleBookStructQuery(queryParams), {
      queryParams,
    });
    if (result && result.records.length > 0) {
      /**
       const rulebooks = result.records.map((record) => {
        const rulebookResult = {
          ...common.getPropertiesFromRecord(record, "rbi"),
        };
        return rulebookResult;
      });
      common.loggingData(logRulebook, {
        type: constants.LOG_TYPE_ID.DELETE_RULE_BOOK_ISSUE,
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
