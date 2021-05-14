/* eslint-disable dot-notation */
/* eslint-disable array-callback-return */
/* eslint-disable no-unused-vars */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const fs = require("fs");
const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const {
  getRuleElementStateTreeStructure,
} = require("../../../neo4j/tree-query");
const { defaultLanguage } = require("../../../config/application");
const getRuleElementStateStatus = require("./get-rule-element-state-status");
const { getUser } = require("../../../neo4j/query");

const getStatesAndUpdateStatus = (
  ruleElementState,
  nowDate,
  isExistsElementStateEN,
  isExistsElementStateDE
) => {
  ruleElementState.forEach((element) => {
    if (element.has_rule_element) {
      if (
        element.has_rule_element_state &&
        element.has_rule_element_state.length > 0
      ) {
        const stateData = _.cloneDeep(element.has_rule_element_state);
        const stateObject = [];
        element.has_rule_element_state = [];
        stateData.forEach((stateElement) => {
          const obj = { en: null, de: null };
          if (stateElement.rule_element_state_language_is.length > 0) {
            const lang =
              stateElement.rule_element_state_language_is[0].iso_639_1;
            obj[lang] = {
              ...stateElement,
            };

            if (obj[lang].rule_element_title !== "") {
              obj[lang].rule_element_title_display = common.removeTag(
                obj[lang].rule_element_title
              );
            }
            const status = getRuleElementStateStatus(
              _.cloneDeep(obj[lang]),
              nowDate
            );
            if (status === constants.RULE_ELEMENT_STATE_STATUS.GREEN) {
              obj[lang].rule_element_status = status;
              obj[lang].identity = stateElement["_id"];
              delete obj[lang].rule_element_state_language_is;
              stateObject.push(obj);
            }
          }
        });
        const deList = [];
        const enList = [];
        stateObject.forEach((el) => {
          if (el.de) {
            deList.push(el.de);
          }
          if (el.en) {
            enList.push(el.en);
          }
        });
        const activeState = { en: null, de: null };
        if (enList.length > 0) {
          activeState.en = enList[enList.length - 1];
        }
        if (deList.length > 0) {
          isExistsElementStateEN = true;
          activeState.de = deList[deList.length - 1];
        }
        if (activeState.en || activeState.de) {
          isExistsElementStateDE = true;
          element.has_rule_element_state.push(activeState);
        }
      }
      if (!element.rule_element_is_rule_book) {
        getStatesAndUpdateStatus(
          element.has_rule_element,
          nowDate,
          isExistsElementStateEN,
          isExistsElementStateDE
        );
      } else {
        _.set(element, "has_rule_element", []);
      }
    } else if (
      element.has_rule_element_state &&
      element.has_rule_element_state.length > 0
    ) {
      const stateData = _.cloneDeep(element.has_rule_element_state);
      const stateObject = [];
      element.has_rule_element_state = [];
      stateData.forEach((stateElement) => {
        const obj = { en: null, de: null };
        const lang = stateElement.rule_element_state_language_is[0].iso_639_1;
        obj[lang] = {
          ...stateElement,
        };

        if (obj[lang].rule_element_title !== "") {
          obj[lang].rule_element_title_display = common.removeTag(
            obj[lang].rule_element_title
          );
        }
        const status = getRuleElementStateStatus(
          _.cloneDeep(obj[lang]),
          nowDate
        );
        if (status === constants.RULE_ELEMENT_STATE_STATUS.GREEN) {
          obj[lang].identity = stateElement["_id"];
          obj[lang].rule_element_status = status;
          delete obj[lang].rule_element_state_language_is;
          stateObject.push(obj);
        }
      });

      const deList = [];
      const enList = [];
      stateObject.forEach((el) => {
        if (el.de) {
          deList.push(el.de);
        }
        if (el.en) {
          enList.push(el.en);
        }
      });
      const activeState = { en: null, de: null };
      if (enList.length > 0) {
        activeState.en = enList[enList.length - 1];
      }
      if (deList.length > 0) {
        isExistsElementStateDE = true;
        activeState.de = deList[deList.length - 1];
      }
      if (activeState.en || activeState.de) {
        isExistsElementStateEN = true;
        element.has_rule_element_state.push(activeState);
      }
    }
  });
  return {
    isExistsElementStateEN,
    isExistsElementStateDE,
  };
};

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userEmail = user ? user.user_email : null;
  const systemAdmin = user.user_is_sys_admin || null;
  const userIsAuthor = user.user_is_author || null;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const session = driver.session();
  let settings = null;
  params = JSON.parse(JSON.stringify(params));
  const ruleBookId = params.rule_book_id;
  const ruleBookIssueNo = params.rule_book_issue_no;
  const currentDate = _.get(params, "current_date", null);
  const ruleElementDocId = _.get(params, "rule_element_doc_id", null);
  let nowDate = common.getTimestamp();
  if (currentDate) {
    nowDate = common.getTimestamp(currentDate);
  }
  let ruleElementStructureList = [];
  try {
    if ((!systemAdmin && !userIsAuthor) || !ruleBookId) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const queryParams = {
      rule_book_id: ruleBookId,
    };
    if (ruleElementDocId) {
      queryParams.rule_element_doc_id = ruleElementDocId;
    }
    const result = await session.run(
      getRuleElementStateTreeStructure(queryParams),
      queryParams
    );
    if (result.records && result.records.length > 0) {
      ruleElementStructureList = result.records.map((record) => {
        const ruleBook = record.get("rule_book");
        const ruleBookResponse = {
          rule_book_active: ruleBook.rule_book_active,
          rule_book_id: ruleBook.rule_book_id,
          rule_book_issue: _.get(ruleBook, "has_rule_book_issue[0]", null),
        };
        return ruleBookResponse;
      });
      const ruleBookIssue = _.get(ruleElementStructureList, "[0]", null);
      if (
        ruleBookIssue &&
        _.get(ruleBookIssue, "rule_book_issue.has_rule_element", null)
      ) {
        const ruleElementState = _.get(
          ruleBookIssue,
          "rule_book_issue.has_rule_element",
          null
        );
        const {
          isExistsElementStateEN,
          isExistsElementStateDE,
        } = getStatesAndUpdateStatus(ruleElementState, nowDate, false, false);
        _.set(
          ruleElementStructureList,
          "[0].is_exists_rule_element_state_de",
          isExistsElementStateDE
        );
        _.set(
          ruleElementStructureList,
          "[0].is_exists_rule_element_state_en",
          isExistsElementStateEN
        );
        if (userEmail) {
          const settingResult = await session.run(getUser, {
            user_email: userEmail,
          });
          if (settingResult && settingResult.records.length > 0) {
            const userData = settingResult.records.map((record) => {
              const userResult = {
                left: common.getPropertiesFromRecord(record, "lang2").iso_639_1,
                right: common.getPropertiesFromRecord(record, "lang3")
                  .iso_639_1,
              };
              return userResult;
            });
            settings = userData[0];
          }
        }
        _.set(
          ruleElementStructureList,
          "[0].language_preference_settings",
          settings
        );
      }
      return _.get(ruleElementStructureList, "[0]", null);
    }
    return null;
  } catch (error) {
    session.close();
    throw error;
  } finally {
    await session.close();
  }
};
