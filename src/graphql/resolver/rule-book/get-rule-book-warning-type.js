/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { getRuleBookWarningType } = require("../../../neo4j/rule-book-query");

module.exports = async () => {
  const session = driver.session();
  let WarningTypeList = [];
  try {
    const result = await session.run(getRuleBookWarningType);
    WarningTypeList = result.records.map((record) => {
      const typeResult = record.get("value");
      return typeResult;
    });
    // console.log(JSON.stringify(WarningTypeList[0]));
    return WarningTypeList[0];
  } catch (error) {
    session.close();
    throw error;
  }
};
