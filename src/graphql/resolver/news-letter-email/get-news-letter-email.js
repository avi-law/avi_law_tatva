/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { common } = require("../../../utils");
const { getNewsletterEmail } = require("../../../neo4j/query");

module.exports = async (object, params) => {
  const nlEmailOrd = params.nl_email_ord;
  const session = driver.session();
  let nlIds = null;
  try {
    const result = await session.run(getNewsletterEmail, {
      nl_email_ord: nlEmailOrd,
    });
    if (result && result.records.length > 0) {
      const newsLettersEmail = result.records.map((record) => {
        const nles = {
          de: {
            nl_email_subject: null,
            nl_email_text_initial: null,
            nl_email_text_final: null,
          },
          en: {
            nl_email_subject: null,
            nl_email_text_initial: null,
            nl_email_text_final: null,
          },
        };
        if (record.get("nles") && record.get("nles").length > 0) {
          record.get("nles").forEach((nlEmailState) => {
            if (
              nlEmailState.lang &&
              nlEmailState.nles &&
              nlEmailState.lang.properties.iso_639_1
            ) {
              nles[nlEmailState.lang.properties.iso_639_1] =
                nlEmailState.nles.properties;
            }
          });
        }
        const nlList = _.orderBy(record.get("nl"), ["order"], ["asc"]);
        if (nlList) {
          nlIds = _.map(nlList, "nl_id");
        }

        const nlEmailResult = {
          nle: common.getPropertiesFromRecord(record, "nle"),
          nles,
          nl_tags: nlIds,
        };
        return nlEmailResult;
      });
      return newsLettersEmail[0];
    }
    return null;
  } catch (error) {
    session.close();
    throw error;
  }
};
