/* eslint-disable array-callback-return */
/* eslint-disable no-unused-vars */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const fs = require("fs");
const driver = require("../../../config/db");
const { common, constants } = require("../../../utils");
const { getUser } = require("../../../neo4j/query");
const { getRuleBooksStructure } = require("../../../neo4j/tree-query");
const { frontendURL } = require("../../../config/application");

const languageImageAndTitle = {
  de: {
    image: `${frontendURL}assets/images/GER.jpg`,
    title: constants.PROVISION_IMAGE_TITLE_GER,
    lang: "en",
  },
  en: {
    image: `${frontendURL}assets/images/EN.jpg`,
    title: constants.PROVISION_IMAGE_TITLE_EN,
    lang: "de",
  },
};

const getNestedChildren = (array) => {
  array = array.filter((element) => {
    if (element.has_rule_book_child) {
      element.has_rule_book_child = getNestedChildren(
        element.has_rule_book_child
      );
      if (element.has_rule_book_child.length === 0) {
        element.has_rule_book_child = null;
      }
      if (
        element.has_rule_book_issue_state.en ||
        element.has_rule_book_issue_state.de
      ) {
        return element;
      }
    } else if (
      element.has_rule_book_issue_state.en ||
      element.has_rule_book_issue_state.de
    ) {
      return element;
    }
  });
  return array;
};

const generateRuleBookTreeStructure = (ruleBookList) => {
  const { treeStructure } = ruleBookList.reduce(
    (acc, curr) => {
      const stateData = _.cloneDeep(curr.res_rbi);
      const ruleBookIssues = _.cloneDeep(curr.res_rbi);
      delete curr.res_rbi;
      curr.has_rule_book_issue_state = {};
      curr.has_rule_book_issue_child = [];
      stateData.forEach((stateElement) => {
        if (stateElement.language) {
          curr.has_rule_book_issue_state[stateElement.language] = {
            ...stateElement,
            title_long_html: stateElement.title_long,
            title_long: stateElement.title_long
              ? common.removeTag(stateElement.title_long)
              : null,
            rule_book_language_is: [
              {
                iso_639_1: stateElement.language,
              },
            ],
          };
        }
      });
      ruleBookIssues.forEach((issue) => {
        if (issue.language) {
          if (curr.has_rule_book_issue_child.length > 0) {
            const exists = curr.has_rule_book_issue_child.find(
              (x) => x.rule_book_issue_no === issue.rule_book_issue_no
            );
            const child = {
              ...issue,
              title_long: issue.title_long
                ? common.removeTag(issue.title_long)
                : null,
              rule_book_language_is: [
                {
                  iso_639_1: issue.language,
                },
              ],
            };
            if (exists) {
              exists[issue.language] = child;
            } else {
              child.rule_book_issue_no = issue.rule_book_issue_no;
              child.label = ["Rule_Book_Issue"];
              child[languageImageAndTitle[issue.language].lang] = {
                ...issue,
                language: languageImageAndTitle[issue.language].lang,
                title_long: issue.title_long
                  ? `<img src="${
                      languageImageAndTitle[issue.language].image
                    }" title="${
                      languageImageAndTitle[issue.language].title
                    }"> ${common.removeTag(issue.title_long)}`
                  : null,
                rule_book_language_is: [
                  {
                    iso_639_1: languageImageAndTitle[issue.language].lang,
                  },
                ],
              };
              curr.has_rule_book_issue_child.push(child);
            }
          } else {
            const child = {
              rule_book_issue_no: issue.rule_book_issue_no,
              label: ["Rule_Book_Issue"],
              [issue.language]: {
                ...issue,
                title_long: issue.title_long
                  ? common.removeTag(issue.title_long)
                  : null,
                rule_book_language_is: [
                  {
                    iso_639_1: issue.language,
                  },
                ],
              },
              [languageImageAndTitle[issue.language].lang]: {
                ...issue,
                language: languageImageAndTitle[issue.language].lang,
                title_long: issue.title_long
                  ? `<img src="${
                      languageImageAndTitle[issue.language].image
                    }" title="${
                      languageImageAndTitle[issue.language].title
                    }"> ${common.removeTag(issue.title_long)}`
                  : null,
                rule_book_language_is: [
                  {
                    iso_639_1: languageImageAndTitle[issue.language].lang,
                  },
                ],
              },
            };
            curr.has_rule_book_issue_child.push(child);
          }
        }
      });
      if (curr.has_rule_book_issue_state) {
        if (
          curr.has_rule_book_issue_state.en &&
          !curr.has_rule_book_issue_state.de
        ) {
          curr.has_rule_book_issue_state.de = _.cloneDeep(
            curr.has_rule_book_issue_state.en
          );
          if (curr.has_rule_book_issue_state.de.title_long) {
            curr.has_rule_book_issue_state.de.title_long = `<img src="${frontendURL}assets/images/EN.jpg" alt="EN"  title="${constants.PROVISION_IMAGE_TITLE_EN}"> ${curr.has_rule_book_issue_state.de.title_long}`;
          }
        } else if (
          !curr.has_rule_book_issue_state.en &&
          curr.has_rule_book_issue_state.de
        ) {
          curr.has_rule_book_issue_state.en = _.cloneDeep(
            curr.has_rule_book_issue_state.de
          );
          if (curr.has_rule_book_issue_state.en.title_long) {
            curr.has_rule_book_issue_state.en.title_long = `<img src="${frontendURL}assets/images/GER.jpg" alt="GER"  title="${constants.PROVISION_IMAGE_TITLE_GER}"> ${curr.has_rule_book_issue_state.en.title_long}`;
          }
        }
      }
      if (acc.parentMap[curr.rule_book_parent_id]) {
        (acc.parentMap[curr.rule_book_parent_id].has_rule_book_child =
          acc.parentMap[curr.rule_book_parent_id].has_rule_book_child ||
          []).push(curr);
      } else {
        curr.has_rule_book_child = null;
        acc.treeStructure.push(curr);
      }
      acc.parentMap[curr.rule_book_id] = curr;
      return acc;
    },
    { parentMap: {}, treeStructure: [] }
  );

  return treeStructure;
};

const generateTreeStructure = (ruleBookStructureList) => {
  const { treeStructure } = ruleBookStructureList.reduce(
    (acc, curr) => {
      const stateData = _.cloneDeep(curr.res_desc_lang);
      const rbsData = _.cloneDeep(curr.rbs_res);
      delete curr.res_desc_lang;
      delete curr.rbs_res;
      curr.has_rule_book_child =
        rbsData.length > 0
          ? generateRuleBookTreeStructure(_.cloneDeep(rbsData))
          : null;
      if (curr.has_rule_book_child) {
        curr.has_rule_book_child =
          getNestedChildren(curr.has_rule_book_child).length > 0
            ? getNestedChildren(curr.has_rule_book_child)
            : null;
      }
      curr.has_rule_book_struct_state = {};
      stateData.forEach((stateElement) => {
        if (stateElement.language) {
          curr.has_rule_book_struct_state[stateElement.language] = {
            rule_book_struct_desc: stateElement.rule_book_struct_desc,
            rule_book_struct_language_is: [
              {
                iso_639_1: stateElement.language,
              },
            ],
          };
        }
      });
      if (acc.parentMap[curr.rule_book_struct_parent_id]) {
        (acc.parentMap[
          curr.rule_book_struct_parent_id
        ].has_rule_book_struct_child =
          acc.parentMap[curr.rule_book_struct_parent_id]
            .has_rule_book_struct_child || []).push(curr);
      } else {
        curr.has_rule_book_struct_child = null;
        acc.treeStructure.push(curr);
      }
      acc.parentMap[curr.rule_book_struct_id] = curr;
      return acc;
    },
    { parentMap: {}, treeStructure: [] }
  );
  return treeStructure;
};

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userEmail = user ? user.user_email : null;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const ruleBookStructId = params.rule_book_struct_id
    ? params.rule_book_struct_id
    : constants.RULE_BOOK_STRUCT_ROOT_ID;
  let ruleBookStructureList = [];
  let settings = null;
  try {
    const result = await session.run(getRuleBooksStructure, {
      rule_book_struct_id: ruleBookStructId,
    });
    ruleBookStructureList = result.records.map((record) => {
      const bookResult = {
        ...record.get("rbss_res"),
        rbs_res: record.get("rbs_res"),
      };
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
    // console.log(generateRuleBookTreeStructure(rra));
    // return false;
    // const finalTree = generateTreeStructure(ruleBookStructureList);
    // fs.writeFile("test1.json", JSON.stringify(finalTree[0]), (err) => {
    //   if (err) return console.log(err);
    // });
    // console.log(JSON.stringify(generateTreeStructure(ruleBookStructureList)));
    return {
      ...generateTreeStructure(ruleBookStructureList)[0],
      language_preference_settings: settings,
    };
  } catch (error) {
    session.close();
    throw error;
  }
};
