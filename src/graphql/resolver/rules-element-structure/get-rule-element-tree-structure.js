/* eslint-disable array-callback-return */
/* eslint-disable no-unused-vars */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const fs = require("fs");
const driver = require("../../../config/db");
const { APIError } = require("../../../utils");
const { getUser } = require("../../../neo4j/query");
const {
  getRuleBooksStructure,
  getRulesElementTreeStructure,
} = require("../../../neo4j/tree-query");
const { defaultLanguage } = require("../../../config/application");

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
    const query = `
    MATCH (rb:Rule_Book {rule_book_id: "${ruleBookId}" })-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue { rule_book_issue_no: ${ruleBookIssueNo}})
    RETURN rb;`;
    if (ruleBookId) {
      const checkExistRuleBook = await session.run(query);
      if (checkExistRuleBook && checkExistRuleBook.records.length === 0) {
        console.log("Does not exists rule book");
        throw new APIError({
          lang: userSurfLang,
          message: "INTERNAL_SERVER_ERROR",
        });
      }
    }
    const result = await session.run(getRulesElementTreeStructure, {
      rule_book_id: ruleBookId,
      rule_book_issue_no: ruleBookIssueNo,
    });
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
