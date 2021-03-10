/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { common } = require("../../../utils");
const { getNewsLetterContentLink } = require("../../../neo4j/query");

module.exports = async () => {
  const session = driver.session();
  let nlLinkList = [];
  try {
    const result = await session.run(getNewsLetterContentLink);
    nlLinkList = result.records.map((record) => {
      const linkResult = {
        ...common.getPropertiesFromRecord(record, "l"),
      };
      return linkResult;
    });
    return nlLinkList;
  } catch (error) {
    session.close();
    throw error;
  }
};
