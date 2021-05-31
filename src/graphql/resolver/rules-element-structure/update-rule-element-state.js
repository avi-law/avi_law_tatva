/* eslint-disable no-param-reassign */

const _ = require("lodash");
const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  updateRuleElementStateQuery,
  logRuleElementState,
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
  let ruleElementInForceUntilPredecessorDate = null;
  let ruleElementAppliesUntilPredecessorDate = null;
  const wantToSetPredecessorDate = _.get(
    data,
    "wantToSetPredecessorDate",
    false
  );
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
      (data.res.de.rule_element_title || data.res.de.rule_element_article) &&
      data.res.de.identity // If you want to create new now at a time of update please remove this but need to change query
    ) {
      isValidDE = true;
    }
    if (
      data.res &&
      data.res.en &&
      (data.res.en.rule_element_title || data.res.en.rule_element_article) &&
      data.res.en.identity // If you want to create new now at a time of update please remove this but need to change query
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
      if (wantToSetPredecessorDate) {
        if (element === "rule_element_in_force_from") {
          ruleElementInForceUntilPredecessorDate = common.subtractDayFromDate(
            data.res.de[element]
          );
        }
        if (element === "rule_element_applies_from") {
          ruleElementAppliesUntilPredecessorDate = common.subtractDayFromDate(
            data.res.de[element]
          );
        }
      }
    });

    const queryParams = {
      isValidEN,
      isValidDE,
      wantToSetPredecessorDate,
      ruleElementAppliesUntilPredecessorDate,
      ruleElementInForceUntilPredecessorDate,
      rule_element_doc_id: _.get(params, "rule_element_doc_id", null),
      res: data.res,
      rule_book_id: _.get(data, "rule_book_id", null),
      rule_book_issue_no: _.get(data, "rule_book_issue_no", null),
      sol_de: _.get(data, "sol_de", null),
      sol_en: _.get(data, "sol_en", null),
      identity: _.get(
        data,
        "res.de.identity",
        _.get(data, "res.en.identity", null)
      ),
    };

    console.log(queryParams);
    console.log(updateRuleElementStateQuery(queryParams));
    // return true;
    const result = await session.run(updateRuleElementStateQuery(queryParams), {
      queryParams,
    });
    // console.log(result);
    if (result && result.records.length > 0) {
      const identity = [];
      result.records.forEach((record) => {
        if (queryParams.isValidEN && queryParams.isValidDE) {
          const enId = record.get("res_en");
          const deId = record.get("res_de");
          identity.push(deId.identity);
          identity.push(enId.identity);
        } else if (queryParams.isValidEN) {
          const enId = record.get("res_en");
          identity.push(enId.identity);
        } else if (queryParams.isValidDE) {
          const deId = record.get("res_de");
          identity.push(deId.identity);
        }
      });
      if (identity.length > 0) {
        common.loggingData(logRuleElementState, {
          type: constants.LOG_TYPE_ID.UPDATE_RULE_ELEMENT_AND_STATE,
          current_user_email: userEmail,
          identity,
        });
      }
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
