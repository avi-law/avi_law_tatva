/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const _ = require("lodash");
const driver = require("../../../config/db");
const { defaultLanguage } = require("../../../config/application");
const { common, APIError } = require("../../../utils");

const getRuleElementState = `
MATCH (res:Rule_Element_State)
WHERE NOT (res)<-[:IS_BACKLINKED_FROM]-() AND res.rule_element_text IS NOT NULL AND size(res.rule_element_text) > 0 AND res.rule_element_text CONTAINS '"[*'
RETURN { identity: id(res), rule_element_text: res.rule_element_text } As res
SKIP toInteger($offset)
LIMIT toInteger($limit)`;

module.exports = async (object, params) => {
  const limit = params.limit || 1000;
  const offset = params.offset || 0;
  const session = driver.session();
  const backlink = [];
  try {
    const result = await session.run(getRuleElementState, {
      limit,
      offset,
    });
    if (result && result.records.length > 0) {
      result.records.forEach((record) => {
        const res = record.get("res");
        if (res) {
          const obj = {
            identity: _.get(res, "identity", null),
            rule_element_doc_id: common.getRuleElementDocIdFromState(
              _.get(res, "rule_element_text", "")
            ),
          };
          if (obj.rule_element_doc_id.length > 0) {
            backlink.push(obj);
          }
        }
      });
      return true;
    }
    throw new APIError({
      lang: defaultLanguage,
      message: "INVALID_REQUEST",
    });
  } catch (error) {
    session.close();
    throw error;
  }
};
