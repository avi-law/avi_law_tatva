/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");

module.exports = async (object, params) => {
  let session;
  let isExists = false;
  params = JSON.parse(JSON.stringify(params));
  const solId = params.sol_id;
  try {
    session = driver.session();
    const query = `
      MATCH (sl:Sol) WHERE sl.sol_id = $sol_id
      RETURN count(sl) as count`;
    const result = await session.run(query, { sol_id: solId });
    if (result && result.records.length > 0) {
      const singleRecord = result.records[0];
      if (singleRecord.get("count")) {
        isExists = true;
      }
    }
    session.close();
    return isExists;
  } catch (error) {
    session.close();
    throw error;
  }
};
