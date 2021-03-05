/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { common } = require("../../../utils");
const {
  getNewsletterYearList,
  getNewsletterListByYear,
  getNewsletterDetails,
  getNewsletterLog,
} = require("../../../neo4j/query");

const getLinkList = require("../link");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  let userEmail = null;
  if (user) {
    userEmail = user.user_email;
  }
  const { lang, country, year } = params;
  const nlId = params.nl_id || null;
  let currentYear = year;
  const response = {
    years: [],
    nl_list: [],
    nl_first: null,
    total: 0,
  };
  if (country) {
    country.push("EU");
  }
  const session = driver.session();
  const listLinks = await getLinkList();
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
        userEmail,
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
              if (!userEmail) {
                nls[nlState.lang.properties.iso_639_1].nl_text = null;
              } else {
                nls[
                  nlState.lang.properties.iso_639_1
                ].nl_text = common.nlContentTransformLink(
                  nls[nlState.lang.properties.iso_639_1].nl_text.toString(),
                  listLinks
                );
              }
            }
          });
        }
        const nlResultArray = {
          nl: common.getPropertiesFromRecord(record, "nl"),
          nls,
          country: common.getPropertiesFromRecord(record, "cou"),
          nl_author: common.getPropertiesFromRecord(record, "u"),
          user: common.getPropertiesFromRecord(record, "user"),
        };
        return nlResultArray;
      });
      response.nl_list = newsLetters;
      response.total = newsLetters.length;
      // eslint-disable-next-line prefer-destructuring
      response.nl_first = newsLetters[0];
    }
    if (nlId && userEmail) {
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
                nls[
                  nlState.lang.properties.iso_639_1
                ].nl_text = common.nlContentTransformLink(
                  nls[nlState.lang.properties.iso_639_1].nl_text.toString(),
                  listLinks
                );
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
        // eslint-disable-next-line prefer-destructuring
        response.nl_first = nlResultDetailsArray[0];
      }
    } else {
      const nlResultLogDetails = await session.run(getNewsletterLog, {
        nl_id: response.nl_first.nl.nl_id,
      });
      if (nlResultLogDetails && nlResultLogDetails.records.length > 0) {
        let createdLog = [];
        let updatedLog = [];
        nlResultLogDetails.records.map((record) => {
          createdLog = record.get("createdLog");
          updatedLog = record.get("updatedLog");
          return true;
        });
        if (createdLog && createdLog.length > 0) {
          createdLog = _.orderBy(createdLog, ["timestamp"], ["desc"]);
        }
        if (updatedLog && updatedLog.length > 0) {
          updatedLog = _.orderBy(updatedLog, ["timestamp"], ["desc"]);
        }
        response.nl_first.createdLog = createdLog;
        response.nl_first.updatedLog = updatedLog;
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
