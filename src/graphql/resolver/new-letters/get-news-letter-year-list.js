/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { common } = require("../../../utils");
const {
  getNewsletterYearList,
  getNewsletterListByYear,
  getNewsletter,
} = require("../../../neo4j/query");

module.exports = async (object, params) => {
  const { lang, country, year } = params;
  const nlId = params.nl_id || null;
  let currentYear = year;
  const response = {
    years: [],
    nl_list: [],
    nl_first: null,
    total: 0,
  };
  const session = driver.session();
  try {
    const result = await session.run(
      getNewsletterYearList({
        country,
        lang,
      })
    );
    if (result && result.records.length > 0) {
      const newsLetterYears = result.records.map((record) =>
        record.get("year")
      );
      response.years = newsLetterYears;
    }
    if (!year && response.years.length > 0) {
      // eslint-disable-next-line prefer-destructuring
      currentYear = response.years[0];
    }
    const nlResult = await session.run(
      getNewsletterListByYear({
        country,
        lang,
        currentYear,
      })
    );
    if (nlResult && nlResult.records.length > 0) {
      const newsLetters = nlResult.records.map((record) => {
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
          user: common.getPropertiesFromRecord(record, "u"),
        };
        return nlResultArray;
      });
      response.nl_list = newsLetters;
      response.total = newsLetters.length;
      // eslint-disable-next-line prefer-destructuring
      response.nl_first = newsLetters[0];
    }
    if (nlId) {
      const nlResultDetails = await session.run(getNewsletter, {
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
        response.nl_first = nlResultDetailsArray[0];
      }
    }
    if (response.nl_list.length === 0) {
      response.nl_first = null;
    }
    return response;
  } catch (error) {
    session.close();
    throw error;
  }
};
