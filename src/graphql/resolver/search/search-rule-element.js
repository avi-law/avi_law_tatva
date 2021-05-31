/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { common, constants } = require("../../../utils");
const { searchRuleElementQuery } = require("../../../neo4j/search-query");
const getRuleElementStateStatus = require("../rules-element-structure/get-rule-element-state-status");

module.exports = async (object, params, ctx) => {
  const { showAll } = params;
  const nowDate = common.getTimestamp();
  const searchRuleElement = {
    rule_element_list: [],
    total: 0,
  };
  // params.text = text.replace(constants.SEARCH_EXCLUDE_SPECIAL_CHAR_REGEX, "");
  const queryParams = {
    ...params,
  };
  const session = driver.session();
  try {
    // console.log(searchRuleElementQuery(queryParams));
    const ruleElementResult = await session.run(
      searchRuleElementQuery(queryParams)
    );
    if (ruleElementResult && ruleElementResult.records.length > 0) {
      const ruleElements = [];
      const res = {};
      ruleElementResult.records.forEach((record, index) => {
        const reState = record.get("res");
        const stateIdentity = _.get(reState, "identity", null);
        const { value: versionOfId } = common.getValue(
          reState,
          "rule_element_state_language_version_identity",
          index
        );
        const stateLang = _.get(reState, "rule_element_state_langauge", null);
        let uniqueKey = "";
        if (stateLang && stateIdentity) {
          if (versionOfId && stateLang === "de") {
            uniqueKey = `${versionOfId}_${stateIdentity}`;
          } else {
            uniqueKey = `${stateIdentity}_${versionOfId}`;
          }
          if (reState.rule_element_title !== "") {
            reState.rule_element_title_display = common.removeTag(
              reState.rule_element_title
            );
          }
          if (!res[uniqueKey]) {
            res[uniqueKey] = {};
          }

          res[uniqueKey][stateLang] = reState;

          const status = getRuleElementStateStatus(
            _.cloneDeep(res[uniqueKey][stateLang]),
            nowDate
          );
          res[uniqueKey][stateLang].rule_element_status = status;
        }
      });
      if (res && Object.keys(res).length > 0) {
        Object.keys(res).forEach((e) => {
          let re = _.get(res[e], "en.re", null);
          if (!re) {
            re = _.get(res[e], "de.re", null);
          }
          let rbis = _.get(res[e], "en.rbis", null);
          if (!rbis) {
            rbis = _.get(res[e], "de.rbis", null);
          }
          let resStatus = _.get(res[e], "en.rule_element_status", null);
          if (!resStatus) {
            resStatus = _.get(res[e], "de.rule_element_status", null);
          }
          if (showAll) {
            ruleElements.push({
              rbis,
              re,
              res: res[e],
            });
          } else if (resStatus === constants.RULE_ELEMENT_STATE_STATUS.GREEN) {
            ruleElements.push({
              rbis,
              re,
              res: res[e],
            });
          }
        });
      }
      searchRuleElement.rule_element_list = ruleElements;
      searchRuleElement.total = ruleElements.length;
    }
    return searchRuleElement;
  } catch (error) {
    session.close();
    throw error;
  }
};
