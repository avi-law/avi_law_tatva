/* eslint-disable no-param-reassign */

const _ = require("lodash");
const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  addRuleElementStateQuery,
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
  let isValidDE = false;
  let isValidEN = false;
  try {
    if (!systemAdmin && !userIsAuthor) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }

    if (
      data.res &&
      data.res.de &&
      (data.res.de.rule_element_title || data.res.de.rule_element_article)
    ) {
      isValidDE = true;
    }
    if (
      data.res &&
      data.res.en &&
      (data.res.en.rule_element_title || data.res.en.rule_element_article)
    ) {
      isValidEN = true;
    }
    const convertDateToNeo4jFields = [
      "rule_element_applies_from",
      "rule_element_in_force_until",
      "rule_element_applies_until",
      "rule_element_in_force_from",
      "rule_element_visible_until",
      "rule_element_visible_from",
    ];
    convertDateToNeo4jFields.forEach((element) => {
      if (data.res.en && data.res.en[element]) {
        data.res.en[element] = common.convertToTemporalDate(
          data.res.en[element]
        );
      }
      if (data.res.de && data.res.de[element]) {
        data.res.de[element] = common.convertToTemporalDate(
          data.res.de[element]
        );
      }
    });
    const queryParams = {
      isValidEN,
      isValidDE,
      rule_element_doc_id: _.get(params, "rule_element_doc_id", null),
      res: data.res,
      sol_de: _.get(data, "sol_de", null),
      sol_en: _.get(data, "sol_en", null),
      rule_element_successor_de: _.get(
        data,
        "res.de.rule_element_successor_identity",
        null
      ),
      rule_element_successor_en: _.get(
        data,
        "res.en.rule_element_successor_identity",
        null
      ),
    };

    console.log(queryParams);
    console.log(addRuleElementStateQuery(queryParams));
    const result = await session.run(addRuleElementStateQuery(queryParams), {
      queryParams,
    });
    // console.log(result);
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
  } finally {
    session.close();
  }
};
