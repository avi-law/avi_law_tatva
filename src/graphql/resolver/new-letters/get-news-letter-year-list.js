/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { getNewsletterYearList } = require("../../../neo4j/query");

module.exports = async (object, params) => {
  const { lang, country } = params;
  const session = driver.session();
  try {
    const result = await session.run(
      getNewsletterYearList({
        country,
        lang,
      })
    );
    if (result && result.records.length > 0) {
      const newsLetterYears = result.records.map((record) =>
        record.get("year")
      );
      return newsLetterYears;
    }
    return [];
  } catch (error) {
    session.close();
    throw error;
  }
};
