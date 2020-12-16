/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { getNewsletter } = require("../../../neo4j/query");

module.exports = async (object, params) => {
  const { id } = params;
  const session = driver.session();
  try {
    const result = await session.run(getNewsletter, { nl_article_id: id });
    if (result && result.records.length > 0) {
      const singleRecord = result.records[0];
      return singleRecord.get(0).properties;
    }
    return null;
  } catch (error) {
    session.close();
    throw error;
  }
};
