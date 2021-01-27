/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { common } = require("../../../utils");
const {
  getNewsletterByLang,
  getDefaultNewsletter,
} = require("../../../neo4j/query");

module.exports = async (object, params) => {
  const { lang } = params;
  const session = driver.session();
  try {
    let query = getDefaultNewsletter;
    if (lang && lang.length > 0) {
      query = getNewsletterByLang;
    }
    const result = await session.run(query, { LANG_ARRAY: lang });
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
