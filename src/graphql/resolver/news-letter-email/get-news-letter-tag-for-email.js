/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { common } = require("../../../utils");
const { getNewsLetterTagForEmail } = require("../../../neo4j/query");

module.exports = async () => {
  const session = driver.session();
  try {
    const result = await session.run(getNewsLetterTagForEmail);
    if (result && result.records.length > 0) {
      const nlEmailTags = result.records.map((record) => {
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
        const nlResultArray = {
          nl: common.getPropertiesFromRecord(record, "nl"),
          nls,
          country: common.getPropertiesFromRecord(record, "cou"),
        };
        return nlResultArray;
      });
      return nlEmailTags;
    }
    session.close();
    return [];
  } catch (error) {
    session.close();
    throw error;
  }
};
