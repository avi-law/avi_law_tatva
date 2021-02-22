/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { common } = require("../../../utils");
const { getNewsletterDetails } = require("../../../neo4j/query");

module.exports = async (object, params) => {
  const nlId = params.nl_id;
  const session = driver.session();
  try {
    const nlResultDetails = await session.run(getNewsletterDetails, {
      nl_id: nlId,
    });
    if (nlResultDetails && nlResultDetails.records.length > 0) {
      const nlResultDetailsArray = nlResultDetails.records.map((record) => {
        const nls = {
          de: {
            nl_text: null,
            nl_title_long: null,
            nl_title_short: null,
          },
          en: {
            nl_text: null,
            nl_title_long: null,
            nl_title_short: null,
          },
        };
        if (record.get("nls") && record.get("nls").length > 0) {
          record.get("nls").forEach((nlState) => {
            if (
              nlState.lang &&
              nlState.nls &&
              nlState.lang.properties.iso_639_1
            ) {
              nls[nlState.lang.properties.iso_639_1] = nlState.nls.properties;
            }
          });
        }
        return {
          nl: common.getPropertiesFromRecord(record, "nl"),
          nls,
          country: common.getPropertiesFromRecord(record, "cou"),
          user: common.getPropertiesFromRecord(record, "u"),
        };
      });
      // eslint-disable-next-line prefer-destructuring
      return nlResultDetailsArray[0];
    }
    return null;
  } catch (error) {
    session.close();
    throw error;
  }
};
