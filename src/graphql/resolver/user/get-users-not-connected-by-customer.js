/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { common } = require("../../../utils");
const { getUsersNotConnectByCustomer } = require("../../../neo4j/query");

module.exports = async () => {
  const session = driver.session();
  try {
    const result = await session.run(getUsersNotConnectByCustomer);
    session.close();
    if (result && result.records.length > 0) {
      const users = result.records.map((record) =>
        common.getPropertiesFromRecord(record, "u")
      );
      return users;
    }
    return [];
  } catch (error) {
    session.close();
    throw error;
  }
};
