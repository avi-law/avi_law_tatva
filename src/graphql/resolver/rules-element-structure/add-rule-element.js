/* eslint-disable no-param-reassign */

const _ = require("lodash");
const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  addRuleElementQuery,
  logRuleElement,
  createBacklinkByRuleElement,
} = require("../../../neo4j/rule-element-query");

const createBacklink = (ruleElementDocId) => {
  const session = driver.session();
  try {
    return session
      .run(createBacklinkByRuleElement, { ruleElementDocId })
      .then(() => {
        session.close();
        return true;
      })
      .catch((err) => {
        session.close();
        throw err;
      });
  } catch (error) {
    session.close();
    console.log("add create backlink Error", error.message);
    return false;
  }
};

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
      re: data.re,
      rule_book_issue_no: data.rule_book_issue_no,
      rule_book_id: data.rule_book_id,
    };
    if (data.rule_element_parent_doc_id) {
      queryParams.rule_element_parent_doc_id = data.rule_element_parent_doc_id;
    }
    queryParams.rule_element_order = _.get(data, "rule_element_order", 10);
    console.log(queryParams);
    console.log(addRuleElementQuery(queryParams));
    // return false;
    const result = await session.run(addRuleElementQuery(queryParams), {
      queryParams,
    });
    if (result && result.records.length > 0) {
      const ruleElement = result.records.map((record) => {
        const ruleElementResult = {
          ...common.getPropertiesFromRecord(record, "re"),
        };
        return ruleElementResult;
      });
      const ruleElementDocId = _.get(
        ruleElement,
        "[0].rule_element_doc_id",
        null
      );
      if (ruleElementDocId) {
        common.loggingData(logRuleElement, {
          type: constants.LOG_TYPE_ID.CREATE_RULE_ELEMENT_AND_STATE,
          current_user_email: userEmail,
          rule_book_issue_no: data.rule_book_issue_no,
          rule_book_id: data.rule_book_id,
          rule_element_doc_id: ruleElementDocId,
        });
        createBacklink(ruleElementDocId);
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
