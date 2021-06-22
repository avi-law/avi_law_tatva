/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { getRuleElementTags } = require("../../../neo4j/rule-element-query");

module.exports = async (object, params, ctx) => {
  const session = driver.session();
  const re = { amc: null, gm: null, cs: null };
  try {
    const resultAmc = await session.run(getRuleElementTags, { string: "AMC" });
    if (resultAmc && resultAmc.records.length > 0) {
      resultAmc.records.forEach((record) => {
        re.amc = record.get("re");
      });
    }
    const resultGm = await session.run(getRuleElementTags, { string: "_GM" });
    if (resultGm && resultGm.records.length > 0) {
      resultGm.records.forEach((record) => {
        re.gm = record.get("re");
      });
    }
    const resultCs = await session.run(getRuleElementTags, { string: "CS" });
    if (resultCs && resultCs.records.length > 0) {
      resultCs.records.forEach((record) => {
        re.cs = record.get("re");
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
