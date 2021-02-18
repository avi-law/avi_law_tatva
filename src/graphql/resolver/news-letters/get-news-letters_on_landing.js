/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { common, constants } = require("../../../utils");
const {
  getNewsletterByLang,
  getDefaultNewsletter,
} = require("../../../neo4j/query");

module.exports = async (object, params) => {
  const { lang, country } = params;
  const session = driver.session();
  const limit = constants.NL_LIMIT_ON_LANDING_PAGE;
  try {
    let query = getDefaultNewsletter;
    if (country && country.length > 0) {
      query = getNewsletterByLang;
    }
    const result = await session.run(query, {
      country,
      lang,
      limit,
    });
    if (result && result.records.length > 0) {
      const newsLetters = result.records.map((record) => {
        const nlResult = {
          ...common.getPropertiesFromRecord(record, "nl"),
          nl_state: {
            ...common.getPropertiesFromRecord(record, "nls"),
            nl_language: common.getPropertiesFromRecord(record, "lang"),
          },
          user: common.getPropertiesFromRecord(record, "u"),
          country: common.getPropertiesFromRecord(record, "cou"),
        };
        return nlResult;
      });
      return newsLetters;
    }
    return [];
  } catch (error) {
    session.close();
    throw error;
  }
};
