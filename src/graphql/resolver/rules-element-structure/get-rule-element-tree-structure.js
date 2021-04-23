/* eslint-disable array-callback-return */
/* eslint-disable no-unused-vars */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const fs = require("fs");
const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { getUser } = require("../../../neo4j/query");
const {
  getRuleBooksStructure,
  getRulesElementTreeStructure,
} = require("../../../neo4j/tree-query");
const { frontendURL } = require("../../../config/application");
const { defaultLanguage } = require("../../../config/application");

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

const generateRuleBookTreeStructure = (ruleElementList) => {
  const { treeStructure } = ruleElementList.reduce(
    (acc, curr) => {
      curr.has_rule_element_child = null;
      // Create rule book issue child object to array
      if (acc.parentMap[curr.rule_element_parent_doc_id]) {
        (acc.parentMap[curr.rule_element_parent_doc_id].has_rule_element_child =
          acc.parentMap[curr.rule_element_parent_doc_id]
            .has_rule_element_child || []).push(curr);
      } else {
        curr.has_rule_element_child = null;
        acc.treeStructure.push(curr);
      }
      acc.parentMap[curr.rule_element_doc_id] = curr;
      return acc;
    },
    { parentMap: {}, treeStructure: [] }
  );
  return treeStructure;
};

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userEmail = user ? user.user_email : null;
  const systemAdmin = user.user_is_sys_admin || null;
  const userIsAuthor = user.user_is_author || null;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const ruleBookId = params.rule_book_id;
  const ruleBookIssueNo = params.rule_book_issue_no;
  let ruleElementStructureList = [];
  try {
    if ((!systemAdmin && !userIsAuthor) || !ruleBookId) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const result = await session.run(getRulesElementTreeStructure, {
      rule_book_id: ruleBookId,
      rule_book_issue_no: ruleBookIssueNo,
    });
    if (result.records && result.records.length > 0) {
      ruleElementStructureList = result.records.map((record) => {
        const elements = record.get("rule_element");
        const ruleBookIssue = record.get("rule_book_issue");
        const ruleBook = {
          rule_element_header_lvl: null,
          rule_element_parent_doc_id: null,
          rule_element_doc_id: ruleBookId,
        };
        let bookResult = {};
        if (ruleBookIssue) {
          bookResult = ruleBookIssue.properties;
          bookResult = {
            ...bookResult,
            rule_element: [ruleBook],
          };
          if (elements.length > 0) {
            elements.forEach((el) => {
              bookResult.rule_element.push(el.properties);
            });
          }
          bookResult.rule_element = generateRuleBookTreeStructure(
            bookResult.rule_element
          );
          return bookResult;
        }
      });
      if (ruleElementStructureList[0]) {
        return ruleElementStructureList[0];
      }
    }
    return null;
  } catch (error) {
    session.close();
    throw error;
  } finally {
    await session.close();
  }
};
