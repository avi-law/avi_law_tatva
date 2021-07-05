/* eslint-disable no-shadow */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  getHitechRuleElementList,
} = require("../../../neo4j/rule-element-query");

const getSuccessorRuleElement = (array, list) => {
  const ruleElementStateList = list;
  // let rootIdentityDE = _.get(ruleElementStateList, "[0]de.identity", null);
  // let rootIdentityEN = _.get(ruleElementStateList, "[0]en.identity", null);
  const stateListDE = _.filter(array, { rule_element_state_langauge: "de" });
  const stateListEN = _.filter(array, { rule_element_state_langauge: "en" });
  // console.log("stateListDE.length", stateListDE.length);
  // console.log("stateListEN.length", stateListEN.length);
  if (
    stateListDE.length === stateListEN.length ||
    stateListDE.length > stateListEN.length
  ) {
    stateListDE.forEach((deObject) => {
      if (deObject.rule_element_title !== "") {
        deObject.rule_element_title_display = common.removeTag(
          deObject.rule_element_title
        );
      }
      const object = { de: deObject };
      let enObject = null;
      if (deObject.rule_element_state_language_version_identity) {
        const versionOf = _.get(
          deObject,
          "rule_element_state_language_version_identity",
          null
        );
        if (versionOf) {
          enObject = _.find(stateListDE, {
            identity: versionOf,
          });
        }
        if (enObject) {
          if (enObject.rule_element_title !== "") {
            enObject.rule_element_title_display = common.removeTag(
              enObject.rule_element_title
            );
          }
          object.de = deObject;
        }
      }
      if (Object.keys(object).length > 0) {
        ruleElementStateList.push(object);
      }
    });
  }
  if (stateListDE.length < stateListEN.length) {
    stateListEN.forEach((enObject) => {
      if (enObject.rule_element_title !== "") {
        enObject.rule_element_title_display = common.removeTag(
          enObject.rule_element_title
        );
      }
      const object = { en: enObject };
      let deObject = null;
      if (enObject.rule_element_state_language_version_identity) {
        const versionOf = _.get(
          enObject,
          "rule_element_state_language_version_identity",
          null
        );
        if (versionOf) {
          deObject = _.find(stateListDE, {
            identity: versionOf,
          });
        }
        if (deObject) {
          if (deObject.rule_element_title !== "") {
            deObject.rule_element_title_display = common.removeTag(
              deObject.rule_element_title
            );
          }
          object.de = deObject;
        }
      }
      if (Object.keys(object).length > 0) {
        ruleElementStateList.push(object);
      }
    });
  }
  return ruleElementStateList;
};

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userIsHitech = user.user_is_hitech || false;
  params = JSON.parse(JSON.stringify(params));
  const session = driver.session();
  const offset = params.offset || 0;
  const limit = params.first || 10;
  const defaultOrderBy = "id(res) DESC";
  let queryOrderBy = "";
  let ruleElementStateList = [];
  const { orderBy, filterByString } = params;
  let condition = `WHERE res.rule_element_hitech = TRUE`;
  // let condition = `WHERE sl.sol_id IS NOT NULL `;
  try {
    if (!userIsHitech) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }

    if (orderBy && orderBy.length > 0) {
      orderBy.forEach((sl) => {
        const field = sl.slice(0, sl.lastIndexOf("_"));
        const last = sl.split("_").pop().toUpperCase();
        if (queryOrderBy === "") {
          queryOrderBy = `res.${field} ${last}`;
          if (field === "_id") {
            queryOrderBy = `id(res) ${last}`;
          }
        } else if (field === "_id") {
          queryOrderBy = `${queryOrderBy}, id(res) ${last}`;
        } else {
          queryOrderBy = `${queryOrderBy}, res.${field} ${last}`;
        }
      });
    }
    if (queryOrderBy === "") {
      queryOrderBy = defaultOrderBy;
    }
    if (filterByString) {
      const value = filterByString.replace(
        constants.SEARCH_EXCLUDE_SPECIAL_CHAR_REGEX,
        ""
      );
      if (/^\d+$/.test(filterByString)) {
        condition = `${condition} AND (toString(id(res)) CONTAINS "${value}" OR toLower(res.rule_element_title) CONTAINS toLower("${value}") OR toLower(res.rule_element_article) CONTAINS toLower("${value}") OR toLower(res.rule_element_text) CONTAINS toLower("${value}") )`;
      } else {
        condition = `${condition} AND ( toLower(res.rule_element_title) CONTAINS toLower("${value}") OR toLower(res.rule_element_article) CONTAINS toLower("${value}") OR toLower(res.rule_element_text) CONTAINS toLower("${value}") )`;
      }
    }
    const result = await session.run(
      getHitechRuleElementList(condition, queryOrderBy)
    );
    if (result && result.records.length > 0) {
      result.records.forEach((record) => {
        const resState = record.get("res");
        if (resState.length > 0) {
          ruleElementStateList = getSuccessorRuleElement(resState, []);
        }
      });
      // limit, offset
      // console.log(ruleElementStateList);
    }
    return {
      res: ruleElementStateList,
      total: ruleElementStateList.length,
    };
  } catch (error) {
    session.close();
    throw error;
  } finally {
    session.close();
  }
};
