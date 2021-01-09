/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { common } = require("../../../utils");
const { getUserCustomerList } = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  params = JSON.parse(JSON.stringify(params));
  const { user } = ctx;
  const userEmail = user.user_email;
  const session = driver.session();
  try {
    const result = await session.run(getUserCustomerList, {
      user_email: userEmail,
    });
    session.close();
    if (result && result.records.length > 0) {
      const customers = result.records.map((record) =>
        common.getPropertiesFromRecord(record, "cs")
      );
      return customers;
    }
    return [];
  } catch (error) {
    session.close();
    throw error;
  }
};
