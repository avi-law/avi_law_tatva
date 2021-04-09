/* eslint-disable no-param-reassign */

const driver = require("../../../config/db");
const _ = require("lodash");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  getRuleBookById,
  addRuleBookQuery,
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
  try {
    if (!systemAdmin && !userIsAuthor) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const queryParams = {
      rb: data.rb,
    };
    if (data.rule_book_parent_id) {
      queryParams.rule_book_parent_id = data.rule_book_parent_id;
    } else if (data.rule_book_struct_parent_id) {
      queryParams.rule_book_struct_parent_id = data.rule_book_struct_parent_id;
    }
    queryParams.rule_book_child_order = _.get(
      data,
      "rule_book_child_order",
      10
    );
    console.log(queryParams);
    console.log(addRuleBookQuery(queryParams));
    const result = await session.run(addRuleBookQuery(queryParams), {
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
        type: constants.LOG_TYPE_ID.CREATE_RULE_BOOK,
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
