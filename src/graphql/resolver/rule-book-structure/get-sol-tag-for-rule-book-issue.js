/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { common } = require("../../../utils");
const { getSolTagForRuleBookIssue } = require("../../../neo4j/rule-book-query");

module.exports = async (object, params) => {
  params = JSON.parse(JSON.stringify(params));
  const { isSort } = params;
  const session = driver.session();
  try {
    const result = await session.run(getSolTagForRuleBookIssue(isSort));
    if (result && result.records.length > 0) {
      if (result && result.records.length > 0) {
        const sols = result.records.map((record) => {
          const sls = {
            de: {
              sol_link: null,
              sol_name_01: null,
              sol_name_02: null,
              sol_name_03: null,
              sol_page: null,
              lang: null,
            },
            en: {
              sol_link: null,
              sol_name_01: null,
              sol_name_02: null,
              sol_name_03: null,
              sol_page: null,
              lang: null,
            },
          };

          if (record.get("sls") && record.get("sls").length > 0) {
            record.get("sls").forEach((slState) => {
              if (slState.lang && slState.sls && slState.lang.iso_639_1) {
                sls[slState.lang.iso_639_1] = slState.sls;
                sls[slState.lang.iso_639_1].lang = slState.lang;
              }
            });
          }
          const slResult = {
            sol_id: record.get("sol_id"),
            sol_state: sls,
          };
          return slResult;
        });
        return {
          sols,
        };
      }
    }
    session.close();
    return [];
  } catch (error) {
    session.close();
    throw error;
  }
};
