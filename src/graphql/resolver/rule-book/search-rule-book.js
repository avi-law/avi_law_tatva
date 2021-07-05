/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { common, APIError } = require("../../../utils");
const {
  searchRuleBook,
  searchRuleBookCount,
} = require("../../../neo4j/rule-book-query");
const { defaultLanguage } = require("../../../config/application");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const systemAdmin = user.user_is_sys_admin || null;
  const userIsAuthor = user.user_is_author || null;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const session = driver.session();
  const offset = params.offset || 0;
  const limit = params.first || 10;
  const defaultOrderBy = "rb.rule_book_id ASC";
  let queryOrderBy = "";
  let total = 0;
  const { orderBy, filterByString, filterByHiTech } = params;
  const response = {
    rule_book: [],
    total,
  };
  try {
    if (!systemAdmin && !userIsAuthor) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    if (orderBy && orderBy.length > 0) {
      orderBy.forEach((rulebook) => {
        const field = rulebook.slice(0, rulebook.lastIndexOf("_"));
        const last = rulebook.split("_").pop().toUpperCase();
        if (queryOrderBy === "") {
          queryOrderBy = `rb.${field} ${last}`;
        } else {
          queryOrderBy = `${queryOrderBy}, rb.${field} ${last}`;
        }
      });
    }
    if (queryOrderBy === "") {
      queryOrderBy = defaultOrderBy;
    }
    const countResult = await session.run(searchRuleBookCount(filterByHiTech), {
      rule_book_id: filterByString,
    });
    if (countResult && countResult.records.length > 0) {
      const singleRecord = countResult.records[0];
      total = singleRecord.get("count");
    }
    const queryParams = {
      rule_book_id: filterByString,
      skip: offset,
      limit,
      queryOrderBy,
    };
    const searchRuleBookResult = await session.run(
      searchRuleBook(filterByHiTech),
      queryParams
    );
    if (searchRuleBookResult && searchRuleBookResult.records.length > 0) {
      const ruleBooks = searchRuleBookResult.records.map((record) => {
        const rbis = {
          de: {
            rule_book_issue_name: null,
            rule_book_issue_popular_title: null,
            rule_book_issue_rmk: null,
            rule_book_issue_title_long: null,
            rule_book_issue_title_short: null,
          },
          en: {
            rule_book_issue_name: null,
            rule_book_issue_popular_title: null,
            rule_book_issue_rmk: null,
            rule_book_issue_title_long: null,
            rule_book_issue_title_short: null,
          },
        };
        if (record.get("rbis") && record.get("rbis").length > 0) {
          record.get("rbis").forEach((rbisState) => {
            if (
              rbisState.lang &&
              rbisState.rbis &&
              rbisState.lang.properties.iso_639_1
            ) {
              rbis[rbisState.lang.properties.iso_639_1] =
                rbisState.rbis.properties;
            }
          });
        }
        const rbResult = {
          rb: common.getPropertiesFromRecord(record, "rb"),
          rbi: common.getPropertiesFromRecord(record, "rbi"),
          rbis,
        };
        return rbResult;
      });
      response.total = total;
      response.rule_book = ruleBooks;
      return response;
    }
    return response;
  } catch (error) {
    console.log(error);
    session.close();
    throw error;
  } finally {
    session.close();
  }
};
