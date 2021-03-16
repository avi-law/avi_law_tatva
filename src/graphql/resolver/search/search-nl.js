/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { common } = require("../../../utils");
const { searchNLQuery } = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { country } = params;
  const searchNL = {
    nl_list: [],
    total: 0,
  };
  if (country) {
    country.push("EU");
  }
  const queryParams = {
    ...params,
    country,
  };
  const session = driver.session();
  try {
    const nlResult = await session.run(searchNLQuery(queryParams));
    if (nlResult && nlResult.records.length > 0) {
      const newsLetters = nlResult.records.map((record) => {
        const nls = {
          de: {
            nl_text: null,
            nl_title_long: null,
            nl_title_short: null,
          },
          en: {
            nl_text: null,
            nl_title_long: null,
            nl_title_short: null,
          },
        };
        if (record.get("nls") && record.get("nls").length > 0) {
          record.get("nls").forEach((nlState) => {
            if (
              nlState.lang &&
              nlState.nls &&
              nlState.lang.properties.iso_639_1
            ) {
              nls[nlState.lang.properties.iso_639_1] = nlState.nls.properties;
              nls[nlState.lang.properties.iso_639_1].nl_text = null;
            }
          });
        }
        const nlResultArray = {
          nl: common.getPropertiesFromRecord(record, "nl"),
          nls,
          country: common.getPropertiesFromRecord(record, "cou"),
        };
        return nlResultArray;
      });
      searchNL.nl_list = newsLetters;
      searchNL.total = newsLetters.length;
    }
    return searchNL;
  } catch (error) {
    session.close();
    throw error;
  }
};
