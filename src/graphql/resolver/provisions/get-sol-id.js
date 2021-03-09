/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");

module.exports = async () => {
  let session;
  let maxSolId;
  try {
    session = driver.session();
    const query = `
      MATCH (sl:Sol) WITH MAX(sl.sol_id) + 1  AS max_sol_id
      RETURN max_sol_id`;
    const result = await session.run(query);
    if (result && result.records.length > 0) {
      const singleRecord = result.records[0];
      maxSolId = singleRecord.get("max_sol_id");
    }
    return maxSolId;
  } catch (error) {
    session.close();
    throw error;
  }
};
