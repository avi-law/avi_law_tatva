/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { common } = require("../../../utils");
const {
  getSolTagForRuleElement,
} = require("../../../neo4j/rule-element-query");

module.exports = async (object, params) => {
  const session = driver.session();
  const {
    orderBy,
    rule_book_issue_no: ruleBookIssueNo,
    rule_book_id: ruleBookId,
  } = params;
  const defaultOrderBy = "sl.sol_date DESC";
  let queryOrderBy = "";
  try {
    if (orderBy && orderBy.length > 0) {
      orderBy.forEach((blog) => {
        const field = blog.slice(0, blog.lastIndexOf("_"));
        const last = blog.split("_").pop().toUpperCase();
        if (queryOrderBy === "") {
          queryOrderBy = `sl.${field} ${last}`;
        } else {
          queryOrderBy = `${queryOrderBy}, sl.${field} ${last}`;
        }
      });
    }
    if (queryOrderBy === "") {
      queryOrderBy = defaultOrderBy;
    }
    const result = await session.run(getSolTagForRuleElement(queryOrderBy), {
      rule_book_issue_no: ruleBookIssueNo,
      rule_book_id: ruleBookId,
    });
    if (result && result.records.length > 0) {
      if (result && result.records.length > 0) {
        const sols = [];
        result.records.forEach((record) => {
          const obj = {
            sol_id: record.get("sol_id"),
            sol_date: record.get("sol_date"),
          };
          if (record.get("sls") && record.get("sls").length > 0) {
            record.get("sls").forEach((slState) => {
              if (slState.lang && slState.sls && slState.lang.iso_639_1) {
                obj[`title_${slState.lang.iso_639_1}`] =
                  slState.sls.sol_name_01;
              }
            });
          }
          obj.title_en = _.get(obj, `title_en`, _.get(obj, `title_de`, null));
          obj.title_de = _.get(obj, `title_de`, _.get(obj, `title_en`, null));
          sols.push(obj);
        });
        return sols;
      }
    }
    session.close();
    return [];
  } catch (error) {
    session.close();
    throw error;
  } finally {
    session.close();
  }
};
