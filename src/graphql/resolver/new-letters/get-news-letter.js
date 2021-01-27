/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { common } = require("../../../utils");
const { getNewsletter } = require("../../../neo4j/query");

module.exports = async (object, params) => {
  const { id } = params;
  const session = driver.session();
  try {
    const result = await session.run(getNewsletter, { nl_id: id });
    if (result && result.records.length > 0) {
      const newsLetters = result.records.map((record) => {
        const nlResult = {
          ...common.getPropertiesFromRecord(record, "nl"),
          nl_state: common.getPropertiesFromRecord(record, "nls"),
          user: common.getPropertiesFromRecord(record, "u"),
          country: common.getPropertiesFromRecord(record, "cou"),
        };
        return nlResult;
      });
      return newsLetters[0];
    }
    return null;
  } catch (error) {
    session.close();
    throw error;
  }
};
