/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { APIError, common } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { getRuleBooks, getUser } = require("../../../neo4j/query");

const getNestedChildren = (array) => {
  array.forEach((element) => {
    if (element.has_rule_book_struct_child) {
      if (
        element.has_rule_book_struct_state &&
        element.has_rule_book_struct_state.length > 0
      ) {
        const stateData = _.cloneDeep(element.has_rule_book_struct_state);
        element.has_rule_book_struct_state = {};
        stateData.forEach((stateElement) => {
          if (stateElement.rule_book_struct_language_is.length > 0) {
            element.has_rule_book_struct_state[
              stateElement.rule_book_struct_language_is[0].iso_639_1
            ] = {
              ...stateElement,
            };
          }
        });
      }
      getNestedChildren(element.has_rule_book_struct_child);
    } else if (
      element.has_rule_book_struct_state &&
      element.has_rule_book_struct_state.length > 0
    ) {
      const stateData = _.cloneDeep(element.has_rule_book_struct_state);
      element.has_rule_book_struct_state = {};
      stateData.forEach((stateElement) => {
        if (stateElement.rule_book_struct_language_is.length > 0) {
          element.has_rule_book_struct_state[
            stateElement.rule_book_struct_language_is[0].iso_639_1
          ] = {
            ...stateElement,
          };
        }
      });
    }
  });
};

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userEmail = user ? user.user_email : null;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  let ruleBookList = [];
  let settings = null;
  try {
    const result = await session.run(getRuleBooks);
    ruleBookList = result.records.map((record) => {
      const bookResult = record.get("value");
      return bookResult;
    });
    if (userEmail) {
      const settingResult = await session.run(getUser, {
        user_email: userEmail,
      });
      if (settingResult && settingResult.records.length > 0) {
        const userData = settingResult.records.map((record) => {
          const userResult = {
            left: common.getPropertiesFromRecord(record, "lang2").iso_639_1,
            right: common.getPropertiesFromRecord(record, "lang3").iso_639_1,
          };
          return userResult;
        });
        settings = userData[0];
      }
    }
    getNestedChildren(ruleBookList[0].has_rule_book_struct_child);
    // console.log(JSON.stringify(ruleBookList[0]));
    return {
      ...ruleBookList[0],
      language_preference_settings: settings,
    };
  } catch (error) {
    session.close();
    throw error;
  }
};
