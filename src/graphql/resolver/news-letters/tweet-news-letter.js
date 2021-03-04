/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError, common } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { getNewsletter, tweetNewsletter } = require("../../../neo4j/query");

const getNewsLetterDetails = async (nlID) => {
  const session = driver.session();
  try {
    const result = await session.run(getNewsletter, { nl_id: nlID });
    if (result && result.records.length > 0) {
      const newsLetters = result.records.map((record) => {
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
        const nlResult = {
          nl: common.getPropertiesFromRecord(record, "nl"),
          nls,
          country: common.getPropertiesFromRecord(record, "cou"),
          user: common.getPropertiesFromRecord(record, "u"),
        };
        return nlResult;
      });
      session.close();
      return newsLetters[0];
    }
  } catch (error) {
    session.close();
    return null;
  }
};

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const systemAdmin = user.user_is_sys_admin || null;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const nlID = params.nl_id;
  try {
    if (!systemAdmin) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const newsLetter = await getNewsLetterDetails(nlID);
    if (newsLetter) {
      if (newsLetter.nl.nl_tweeted) {
        throw new APIError({
          lang: userSurfLang,
          message: "INTERNAL_SERVER_ERROR",
        });
      }
      const result = await session.run(tweetNewsletter, { nl_id: nlID });
      if (result && result.records.length > 0) {
        session.close();
        return true;
      }
      throw new APIError({
        lang: defaultLanguage,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    return false;
  } catch (error) {
    session.close();
    throw error;
  }
};
