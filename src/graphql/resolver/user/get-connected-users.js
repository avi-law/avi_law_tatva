/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { common } = require("../../../utils");
const { getConnectUserList } = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  params = JSON.parse(JSON.stringify(params));
  const { user } = ctx;
  const userEmail = user.user_email;
  const session = driver.session();
  try {
    const result = await session.run(getConnectUserList, {
      user_email: userEmail,
    });
    session.close();
    if (result && result.records.length > 0) {
      const users = result.records.map((record) =>
        common.getPropertiesFromRecord(record, "u2")
      );
      return users;
    }
    return [];
  } catch (error) {
    session.close();
    throw error;
  }
};
