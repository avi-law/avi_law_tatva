/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { getSolsCount, getSols } = require("../../../neo4j/query");
const {
  getHitechRuleElementCount,
  getHitechRuleElementList,
} = require("../../../neo4j/rule-element-query");

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
  let total = 0;
  const { orderBy, filterByString } = params;
  let condition = `WHERE (res.rule_element_hitech = TRUE AND res.rule_element_work_completed = FALSE) OR res.rule_element_hitech IS NULL `;
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
        condition = `${condition} AND (id(res) = ${value} OR toLower(res.rule_element_title) CONTAINS toLower("${value}") OR toLower(res.rule_element_article) CONTAINS toLower("${value}") OR toLower(res.rule_element_text) CONTAINS toLower("${value}") )`;
      } else {
        condition = `${condition} AND ( toLower(res.rule_element_title) CONTAINS toLower("${value}") OR toLower(res.rule_element_article) CONTAINS toLower("${value}") OR toLower(res.rule_element_text) CONTAINS toLower("${value}") )`;
      }
    }
    const countResult = await session.run(getHitechRuleElementCount(condition));
    if (countResult && countResult.records.length > 0) {
      const singleRecord = countResult.records[0];
      total = singleRecord.get("count");
    }
    const result = await session.run(
      getHitechRuleElementList(condition, limit, offset, queryOrderBy)
    );
    if (result && result.records.length > 0) {
      const ruleElementStates = result.records.map((record) => {
        const reState = record.get("res");
        const res = {
          de: null,
          en: null,
        };
        if (reState.lang && reState.res && reState.lang.iso_639_1) {
          res[reState.lang.iso_639_1] = reState.res;
          if (res[reState.lang.iso_639_1].rule_element_title !== "") {
            res[
              reState.lang.iso_639_1
            ].rule_element_title_display = common.removeTag(
              res[reState.lang.iso_639_1].rule_element_title
            );
          }
        }
        return res;
      });
      return {
        res: ruleElementStates,
        total,
      };
    }
    return {
      res: [],
      total,
    };
  } catch (error) {
    session.close();
    throw error;
  } finally {
    session.close();
  }
};
