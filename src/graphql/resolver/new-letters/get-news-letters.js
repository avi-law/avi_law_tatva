/* eslint-disable consistent-return */
const driver = require("../../../config/db");
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
      const newsLetters = result.records.map((record) =>
        record.get("newLetters")
      );
      return newsLetters;
    }
    return [];
  } catch (error) {
    session.close();
    throw error;
  }
};
