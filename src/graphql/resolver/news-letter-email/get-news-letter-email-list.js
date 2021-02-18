/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { common } = require("../../../utils");
const { getNewsLetterEmailList } = require("../../../neo4j/query");

module.exports = async () => {
  const session = driver.session();
  const total = 100;
  try {
    const result = await session.run(getNewsLetterEmailList());
    if (result && result.records.length > 0) {
      const nlEmails = result.records.map((record) => {
        const nlResult = {
          ...common.getPropertiesFromRecord(record, "nle"),
          nl_email_state: {
            ...common.getPropertiesFromRecord(record, "nles"),
          },
        };
        return nlResult;
      });
      return {
        nlEmails,
        total,
      };
    }
    session.close();
    return [];
  } catch (error) {
    session.close();
    throw error;
  }
};
