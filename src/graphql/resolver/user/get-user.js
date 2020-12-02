/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { common } = require("../../../utils");
const { getUserDetails } = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userID = user.user_id;
  const session = driver.session();
  try {
    const result = await session.run(getUserDetails, { user_id: userID });
    if (result && result.records) {
      const singleRecord = result.records[0];
      return singleRecord.get(0).properties;
    }
    throw new Error(common.getMessage("USER_NOT_FOUND"));
  } catch (error) {
    session.close();
    throw error;
  }
};
