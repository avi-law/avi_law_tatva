/* eslint-disable no-param-reassign */

const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  getRuleBookStructById,
  addRuleBookStructQuery,
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
  let isValidDE = false;
  let isValidEN = false;
  let isExists = false;
  try {
    if (!systemAdmin && !userIsAuthor) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    if (data && data.rbs.rule_book_struct_id) {
      const checkExistRuleBookStruct = await session.run(
        getRuleBookStructById,
        {
          rule_book_struct_id: data.rbs.rule_book_struct_id,
        }
      );
      if (
        checkExistRuleBookStruct &&
        checkExistRuleBookStruct.records.length !== 0
      ) {
        isExists = true;
      }
    }
    if (data.rbss && data.rbss.de && data.rbss.de.rule_book_struct_desc) {
      isValidDE = true;
    }
    if (data.rbss && data.rbss.en && data.rbss.en.rule_book_struct_desc) {
      isValidEN = true;
    }
    const queryParams = {
      isExists,
      rbs: data.rbs,
      rbss: data.rbss,
      rule_book_struct_parent_id: data.rule_book_struct_parent_id,
      rule_book_struct_order: data.rule_book_struct_order,
      isValidDE,
      isValidEN,
    };
    console.log(addRuleBookStructQuery(queryParams));
    return true;
    // const result = await session.run(addRuleBookStructQuery(queryParams), {
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
