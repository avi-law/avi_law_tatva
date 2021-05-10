/* eslint-disable no-param-reassign */
const _ = require("lodash");
const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const {
  getRuleElementStateListLatest,
} = require("../../../neo4j/rule-element-query");
const getRuleElementStateStatus = require("./get-rule-element-state-status");
const { defaultLanguage } = require("../../../config/application");

const getSuccessorRuleElement = (array, list) => {
  const ruleElementStateList = list;
  let successorEN = _.get(
    ruleElementStateList,
    "[0]en.has_successor_identity",
    null
  );
  let successorDE = _.get(
    ruleElementStateList,
    "[0]de.has_successor_identity",
    null
  );
  let rootIdentityDE = _.get(ruleElementStateList, "[0]de.identity", null);
  let rootIdentityEN = _.get(ruleElementStateList, "[0]en.identity", null);
  const stateListDE = _.filter(array, { rule_element_state_langauge: "de" });
  const stateListEN = _.filter(array, { rule_element_state_langauge: "en" });
  // console.log("stateListDE.length", stateListDE.length);
  // console.log("stateListEN.length", stateListEN.length);
  if (stateListDE.length === stateListEN.length) {
    stateListDE.forEach((el) => {
      const object = {};
      let enObject = null;
      if (el.rule_element_successor_identity) {
        const deObject = _.find(stateListDE, { identity: successorDE });
        if (deObject.rule_element_title !== "") {
          deObject.rule_element_title_display = common.removeTag(
            deObject.rule_element_title
          );
        }
        if (deObject) {
          const versionOf = _.get(
            deObject,
            "rule_element_state_language_version_identity",
            null
          );
          deObject.has_rule_element_successor = false;
          if (_.get(deObject, "rule_element_successor_identity", null)) {
            deObject.has_rule_element_successor = true;
          }
          if (versionOf) {
            enObject = _.find(stateListEN, {
              identity: versionOf,
            });
          }
          object.de = deObject;
          if (enObject) {
            if (enObject.rule_element_title !== "") {
              enObject.rule_element_title_display = common.removeTag(
                enObject.rule_element_title
              );
            }
            enObject.has_rule_element_successor = false;
            if (_.get(enObject, "rule_element_successor_identity", null)) {
              enObject.has_rule_element_successor = true;
            }
            object.en = enObject;
          }
          successorDE = _.get(deObject, "has_successor_identity", null);
        }
        if (Object.keys(object).length > 0) {
          ruleElementStateList.push(object);
        }
      }
    });
  }
  if (stateListDE.length > stateListEN.length) {
    stateListDE.forEach((el) => {
      const object = {};
      let enObject = null;
      if (el.rule_element_successor_identity) {
        const deObject = _.find(stateListDE, { identity: successorDE });
        if (deObject) {
          if (deObject.rule_element_title !== "") {
            deObject.rule_element_title_display = common.removeTag(
              deObject.rule_element_title
            );
          }
          deObject.has_rule_element_successor = false;
          if (_.get(deObject, "rule_element_successor_identity", null)) {
            deObject.has_rule_element_successor = true;
          }
          const versionOf = _.get(
            deObject,
            "rule_element_state_language_version_identity",
            null
          );
          if (versionOf) {
            enObject = _.find(stateListEN, {
              identity: versionOf,
            });
          }
          object.de = deObject;
          if (enObject) {
            if (enObject.rule_element_title !== "") {
              enObject.rule_element_title_display = common.removeTag(
                enObject.rule_element_title
              );
            }
            enObject.has_rule_element_successor = false;
            if (_.get(enObject, "rule_element_successor_identity", null)) {
              enObject.has_rule_element_successor = true;
            }
            object.en = enObject;
          }
          successorDE = _.get(deObject, "has_successor_identity", null);
        }
        if (Object.keys(object).length > 0) {
          ruleElementStateList.push(object);
        }
      }
    });
  }
  if (stateListDE.length < stateListEN.length) {
    stateListEN.forEach((el) => {
      const object = {};
      let deObject = null;
      if (el.rule_element_successor_identity) {
        const enObject = _.find(stateListEN, { identity: successorEN });
        if (enObject) {
          if (enObject.rule_element_title !== "") {
            enObject.rule_element_title_display = common.removeTag(
              enObject.rule_element_title
            );
          }
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

          enObject.has_rule_element_successor = false;
          if (_.get(enObject, "rule_element_successor_identity", null)) {
            enObject.has_rule_element_successor = true;
          }
          object.en = enObject;
          if (deObject) {
            if (deObject.rule_element_title !== "") {
              deObject.rule_element_title_display = common.removeTag(
                deObject.rule_element_title
              );
            }
            deObject.has_rule_element_successor = false;
            if (_.get(deObject, "rule_element_successor_identity", null)) {
              deObject.has_rule_element_successor = true;
            }
            object.de = deObject;
          }
          successorEN = _.get(enObject, "has_successor_identity", null);
        }
        if (Object.keys(object).length > 0) {
          ruleElementStateList.push(object);
        }
      }
    });
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
  const currentDate = _.get(params, "current_date", null);
  let nowDate = common.getTimestamp();
  if (currentDate) {
    nowDate = common.getTimestamp(currentDate);
  }
  const ruleElementStateList = [];
  let otherRuleElementList = [];
  const res = {};
  try {
    if ((!systemAdmin && !userIsAuthor) || !ruleElementDocId) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const result = await session.run(getRuleElementStateListLatest, {
      rule_element_doc_id: ruleElementDocId,
    });
    if (result && result.records.length > 0) {
      result.records.forEach((record) => {
        const resState = record.get("res");
        let versionOfDE = null;
        let versionOfEN = null;
        if (resState.length > 0) {
          const enObject = _.find(resState, {
            rule_element_successor_identity: null,
            rule_element_state_langauge: "en",
          });
          const deObject = _.find(resState, {
            rule_element_successor_identity: null,
            rule_element_state_langauge: "de",
          });
          if (enObject) {
            if (enObject.rule_element_title !== "") {
              enObject.rule_element_title_display = common.removeTag(
                enObject.rule_element_title
              );
            }
            versionOfEN = _.get(
              enObject,
              "rule_element_state_language_version_identity",
              null
            );
            enObject.has_rule_element_successor = false;
            res.en = enObject;
          }
          if (deObject) {
            if (deObject.rule_element_title !== "") {
              deObject.rule_element_title_display = common.removeTag(
                deObject.rule_element_title
              );
            }
            versionOfDE = _.get(
              deObject,
              "rule_element_state_language_version_identity",
              null
            );
            deObject.has_rule_element_successor = false;
            res.de = deObject;
          }
          if (versionOfDE !== versionOfEN) {
            const successorDE = _.get(deObject, "has_successor_identity", null);
            const successorEN = _.get(enObject, "has_successor_identity", null);
            if (enObject && versionOfDE !== enObject.identity) {
              if (!successorEN) {
                delete res.en;
              }
            }
            if (deObject && versionOfEN !== deObject.identity) {
              if (!successorDE) {
                delete res.en;
              }
            }
          }
          if (Object.keys(res).length > 0) {
            ruleElementStateList.push(res);
            otherRuleElementList = getSuccessorRuleElement(
              resState,
              ruleElementStateList
            );
          }
        }
      });
      // console.lo
      // Update element state status
      if (otherRuleElementList.length > 0) {
        otherRuleElementList.forEach((element) => {
          const object = _.get(element, "de", _.get(element, "en", null));
          if (object) {
            const status = getRuleElementStateStatus(
              _.cloneDeep(object),
              nowDate
            );
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
      return { res: otherRuleElementList };
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
