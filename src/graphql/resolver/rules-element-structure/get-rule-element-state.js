/* eslint-disable no-undef */
/* eslint-disable no-param-reassign */
const _ = require("lodash");
const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const {
  getRuleElementStateListNew,
} = require("../../../neo4j/rule-element-query");
const getRuleElementStateStatus = require("./get-rule-element-state-status");
const { defaultLanguage } = require("../../../config/application");

const getSuccessorRuleElement = (array, list) => {
  let ruleElementStateList = list;
  const object = {};
  let successorArray = [];
  if (array.length > 0 && ruleElementStateList.length > 0) {
    array.forEach((element, index) => {
      let successor = false;
      const language = _.get(
        element,
        "rule_element_state_language_is[0].iso_639_1",
        null
      );
      if (language) {
        const state = _.cloneDeep(element);
        delete state.has_rule_element_successor;
        delete state.rule_element_state_language_is;
        if (state.rule_elemnet_title !== "") {
          state.rule_element_title_display = common.removeTag(
            state.rule_element_title
          );
        }
        object[language] = state;
        object[language].identity = _.get(element, "_id", null);
        ruleElementStateList.forEach((stateElement) => {
          const lastState = _.get(stateElement, `${language}`, null);
          if (lastState) {
            successor = true;
          }
        });
        object[language].has_rule_element_successor = successor;
        if (!successorArray.length) {
          successorArray = _.cloneDeep(
            _.get(element, "has_rule_element_successor", [])
          );
        }
      }
    });
    ruleElementStateList.push(object);
    if (successorArray.length > 0) {
      ruleElementStateList = getSuccessorRuleElement(
        successorArray,
        ruleElementStateList
      );
    }
  }
  return ruleElementStateList;
};

const getStatelist = async (params, ctx) => {
  const { user } = ctx;
  const userEmail = user ? user.user_email : null;
  const systemAdmin = user.user_is_sys_admin || null;
  const userIsAuthor = user.user_is_author || null;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const ruleElementDocId = params.rule_element_doc_id;
  const ruleElementStateList = [];
  let successorArray = [];
  let re = null;
  try {
    if ((!systemAdmin && !userIsAuthor) || !ruleElementDocId) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const result = await session.run(getRuleElementStateListNew, {
      rule_element_doc_id: ruleElementDocId,
    });
    if (result && result.records.length > 0) {
      const res = {};
      result.records.forEach((record) => {
        const resState = record.get("res");
        const value = record.get("value");
        re = common.getPropertiesFromRecord(record, "re");
        if (resState.length > 0) {
          resState.forEach((element) => {
            const res1Properties = _.get(element, "res1.properties", null);
            const language = _.get(element, "lang.properties.iso_639_1", null);
            if (res1Properties.rule_elemnet_title !== "") {
              res1Properties.rule_element_title_display = common.removeTag(
                res1Properties.rule_element_title
              );
            }
            res[language] = res1Properties;
            res[language].identity = _.get(element, "res1.identity", null);
            res[language].has_rule_element_successor = false;
            if (!successorArray.length && Object.keys(value).length > 0) {
              successorArray = _.cloneDeep(value.has_rule_element_successor);
            }
          });
        }
      });
      ruleElementStateList.push(res);
      const otherRuleElementList = getSuccessorRuleElement(
        successorArray,
        ruleElementStateList
      );
      if (otherRuleElementList.length > 0) {
        otherRuleElementList.forEach((element) => {
          const object = _.get(element, "de", _.get(element, "en", null));
          if (object) {
            const status = getRuleElementStateStatus(_.cloneDeep(object));
            object.rule_element_status = status;
            const objectOther = _.get(
              element,
              "en",
              _.get(element, "de", null)
            );
            if (objectOther) {
              objectOther.rule_element_status = status;
            }
          }
        });
      }
      return { re, res: otherRuleElementList };
    }
    return null;
  } catch (error) {
    console.log(error);
    session.close();
    throw error;
  } finally {
    session.close();
  }
};

module.exports = (object, params, ctx) => getStatelist(params, ctx);
