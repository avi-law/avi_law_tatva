/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { getRuleElementTags } = require("../../../neo4j/rule-element-query");

module.exports = async (object, params, ctx) => {
  const session = driver.session();
  let re = [];
  try {
    const result = await session.run(getRuleElementTags);
    if (result && result.records.length > 0) {
      result.records.forEach((record) => {
        re = record.get("re");
      });
    }
    return re;
  } catch (error) {
    session.close();
    throw error;
  } finally {
    session.close();
  }
};
