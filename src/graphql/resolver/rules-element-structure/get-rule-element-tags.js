/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { getRuleElementTags } = require("../../../neo4j/rule-element-query");

const getRuleElementStateArticle = (ruleElements) => {
  if (ruleElements && ruleElements.length > 0) {
    const array = ruleElements.map((e) => {
      const r = {
        identity: e.identity,
        rule_element_doc_id: e.rule_element_doc_id,
        rule_element_article_de: null,
        rule_element_article_en: null,
      };
      if (e.res && e.res.length > 0) {
        e.res.forEach((res) => {
          r[`rule_element_article_${res.iso_639_1}`] = res.rule_element_article;
        });
      }
      return r;
    });
    return array;
  }
  return null;
};

module.exports = async (object, params, ctx) => {
  const session = driver.session();
  const re = { amc: null, gm: null, cs: null };
  try {
    const resultAmc = await session.run(getRuleElementTags, { string: "AMC" });
    if (resultAmc && resultAmc.records.length > 0) {
      resultAmc.records.forEach((record) => {
        re.amc = getRuleElementStateArticle(record.get("re"));
      });
    }
    const resultGm = await session.run(getRuleElementTags, { string: "_GM" });
    if (resultGm && resultGm.records.length > 0) {
      resultGm.records.forEach((record) => {
        re.gm = getRuleElementStateArticle(record.get("re"));
      });
    }
    const resultCs = await session.run(getRuleElementTags, { string: "CS" });
    if (resultCs && resultCs.records.length > 0) {
      resultCs.records.forEach((record) => {
        re.cs = getRuleElementStateArticle(record.get("re"));
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
