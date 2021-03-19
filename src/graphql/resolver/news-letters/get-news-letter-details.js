/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { common } = require("../../../utils");
const { getNewsletterDetails } = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userEmail = user.user_email || null;
  const nlId = params.nl_id;
  const session = driver.session();
  try {
    const nlResultDetails = await session.run(getNewsletterDetails, {
      nl_id: nlId,
      user_email: userEmail,
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
              // // Tempt added
              // nls[
              //   nlState.lang.properties.iso_639_1
              // ].nl_text = `${nlState.nls.properties.nl_text_clone} <br/><span style="color:red">**********************************</span><br/><br/>${nlState.nls.properties.nl_text_clone}`;
              // // Tempt added
            }
          });
        }
        return {
          nl: common.getPropertiesFromRecord(record, "nl"),
          nls,
          country: common.getPropertiesFromRecord(record, "cou"),
          nl_author: common.getPropertiesFromRecord(record, "u"),
          user: common.getPropertiesFromRecord(record, "user"),
          createdLog: record.get("createdLog"),
          updatedLog: record.get("updatedLog"),
        };
      });
      // eslint-disable-next-line prefer-destructuring
      if (nlResultDetailsArray[0] && nlResultDetailsArray[0].createdLog) {
        nlResultDetailsArray[0].createdLog = _.orderBy(
          nlResultDetailsArray[0].createdLog,
          ["timestamp"],
          ["desc"]
        );
      }
      if (nlResultDetailsArray[0] && nlResultDetailsArray[0].updatedLog) {
        nlResultDetailsArray[0].updatedLog = _.orderBy(
          nlResultDetailsArray[0].updatedLog,
          ["timestamp"],
          ["desc"]
        );
      }
      return nlResultDetailsArray[0];
    }
    return null;
  } catch (error) {
    session.close();
    throw error;
  }
};
