/* eslint-disable no-param-reassign */

const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  getRuleBookStructById,
  getRuleBookStructParentByCondition,
  updateRuleBookStructQuery,
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
  const { data } = params;
  const ruleBookStructId = params.rule_book_struct_id;
  const ruleBookStructParentId = params.rule_book_struct_parent_id;
  let isValidDE = false;
  let isValidEN = false;
  try {
    if (!systemAdmin && !userIsAuthor) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    if (data && ruleBookStructId) {
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
    if (
      data &&
      data.rbs &&
      data.rbs.rule_book_struct_id &&
      ruleBookStructId !== data.rbs.rule_book_struct_id
    ) {
      if (data && data.rbs.rule_book_struct_id) {
        const checkParnetExistRuleBookStruct = await session.run(
          getRuleBookStructParentByCondition({
            rule_book_struct_id: data.rbs.rule_book_struct_id,
            where: `WHERE rbsp.rule_book_struct_id <> "${data.rule_book_struct_parent_id}"`,
          }),
          {
            rule_book_struct_id: data.rbs.rule_book_struct_id,
            rule_book_struct_parent_id: data.rule_book_struct_parent_id,
          }
        );
        if (
          checkParnetExistRuleBookStruct &&
          checkParnetExistRuleBookStruct.records.length > 0
        ) {
          throw new APIError({
            lang: userSurfLang,
            message: "RULE_BOOK_STRUCT_ALREADY_ASSIGNED",
          });
        }
      }
    }
    if (data.rbss && data.rbss.de && data.rbss.de.rule_book_struct_desc) {
      isValidDE = true;
    }
    if (data.rbss && data.rbss.en && data.rbss.en.rule_book_struct_desc) {
      isValidEN = true;
    }
    const queryParams = {
      ruleBookStructId,
      rbs: data.rbs,
      rbss: data.rbss,
      isValidDE,
      isValidEN,
    };
    console.log(queryParams);
    console.log(updateRuleBookStructQuery(queryParams));
    return false;
    const result = await session.run(updateRuleBookStructQuery(queryParams), {
      queryParams,
    });
    if (result && result.records.length > 0) {
      /**
       const rulebookStructs = result.records.map((record) => {
        const rulebookStructResult = {
          ...common.getPropertiesFromRecord(record, "rbs"),
        };
        return rulebookStructs;
      });
      common.loggingData(logRulebookStruct, {
        type: constants.LOG_TYPE_ID.UPDATE_RULE_BOOK,
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
