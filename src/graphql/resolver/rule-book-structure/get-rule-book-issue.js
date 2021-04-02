/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { common } = require("../../../utils");
const { getRuleBookIssue } = require("../../../neo4j/rule-book-query");

module.exports = async (object, params) => {
  const ruleBookIssueNo = params.rule_book_issue_no;
  const ruleBookParentId = params.rule_book_parent_id;
  const session = driver.session();
  try {
    const result = await session.run(getRuleBookIssue, {
      rule_book_issue_no: ruleBookIssueNo,
      rule_book_parent_id: ruleBookParentId,
    });
    if (result && result.records.length > 0) {
      const ruleBookIssue = result.records.map((record) => {
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
        const rbiResult = {
          rbi: common.getPropertiesFromRecord(record, "rbi"),
          rbis,
        };
        console.log(rbiResult);
        return rbiResult;
      });
      return ruleBookIssue[0];
    }
    return null;
  } catch (error) {
    session.close();
    throw error;
  }
};
