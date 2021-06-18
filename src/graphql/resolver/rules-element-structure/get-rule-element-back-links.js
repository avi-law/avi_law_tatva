/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const {
  getRuleElementBackLinks,
} = require("../../../neo4j/rule-element-query");

module.exports = async (object, params, ctx) => {
  params = JSON.parse(JSON.stringify(params));
  const session = driver.session();
  const ruleElementDocId = params.rule_element_doc_id;
  const res = {
    de: [],
    en: [],
  };
  try {
    const result = await session.run(getRuleElementBackLinks, {
      rule_element_doc_id: `[*${ruleElementDocId}*]`,
    });
    if (result && result.records.length > 0) {
      result.records.forEach((record) => {
        const reState = record.get("res");
        res.de = _.filter(reState, { iso_639_1: "de" });
        res.en = _.filter(reState, { iso_639_1: "en" });
      });
    }

    res.de =
      res.de.length > 0
        ? _.orderBy(res.de, ["rule_element_doc_id"], ["asc"])
        : null;
    res.en =
      res.en.length > 0
        ? _.orderBy(res.en, ["rule_element_doc_id"], ["asc"])
        : null;
    return res;
  } catch (error) {
    session.close();
    throw error;
  } finally {
    session.close();
  }
};
