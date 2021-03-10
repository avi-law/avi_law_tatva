/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { getSolType } = require("../../../neo4j/query");

module.exports = async () => {
  const session = driver.session();
  let solTypeList = [];
  try {
    const result = await session.run(getSolType);
    solTypeList = result.records.map((record) => {
      const typeResult = record.get("value");
      return typeResult;
    });
    // console.log(JSON.stringify(solTypeList[0]));
    return solTypeList[0];
  } catch (error) {
    session.close();
    throw error;
  }
};
