/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { common } = require("../../../utils");
const { getSol } = require("../../../neo4j/query");

module.exports = async (object, params) => {
  const solId = params.sol_id;
  const session = driver.session();
  try {
    const solResultDetails = await session.run(getSol, {
      sol_id: solId,
    });
    if (solResultDetails && solResultDetails.records.length > 0) {
      const solResultDetailsArray = solResultDetails.records.map((record) => {
        const sls = {
          de: {
            sol_link: null,
            sol_name_01: null,
            sol_name_02: null,
            sol_name_03: null,
            sol_page: null,
          },
          en: {
            sol_link: null,
            sol_name_01: null,
            sol_name_02: null,
            sol_name_03: null,
            sol_page: null,
          },
        };
        if (record.get("sls") && record.get("sls").length > 0) {
          record.get("sls").forEach((slState) => {
            if (
              slState.lang &&
              slState.sls &&
              slState.lang.properties.iso_639_1
            ) {
              sls[slState.lang.properties.iso_639_1] = slState.sls.properties;
            }
          });
        }
        const slt = common.getPropertiesFromRecord(record, "slt");
        return {
          sl: common.getPropertiesFromRecord(record, "sl"),
          sls,
          sol_type_id: slt ? slt.sol_type_id : null,
        };
      });
      if (solResultDetailsArray[0] && solResultDetailsArray[0].sl) {
        solResultDetailsArray[0].sl.sol_no =
          solResultDetailsArray[0].sl.sol_no !== "undefined"
            ? solResultDetailsArray[0].sl.sol_no
            : null;
      }
      return solResultDetailsArray[0];
    }
    return null;
  } catch (error) {
    session.close();
    throw error;
  }
};
