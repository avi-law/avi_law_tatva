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
  const ruleBookIssueNo = params.rule_book_issue_no;
  const ruleBookId = params.rule_book_id;
  try {
    const result = await session.run(getSolTagForRuleElement, {
      rule_book_issue_no: ruleBookIssueNo,
      rule_book_id: ruleBookId,
    });
    if (result && result.records.length > 0) {
      if (result && result.records.length > 0) {
        const sols = [];
        result.records.forEach((record) => {
          const obj = {
            sol_id: record.get("sol_id"),
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
