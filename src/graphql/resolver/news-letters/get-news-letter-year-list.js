/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { common, constants } = require("../../../utils");
const {
  getNewsletterYearList,
  getNewsletterListByYear,
  getNewsletterDetails,
  getNewsletterLog,
  getSourceOfLowBySolIds,
  logNewsletter,
} = require("../../../neo4j/query");

const getSourceOfLaw = async (solIds) => {
  const session = driver.session();
  const resultOfSol = [];
  try {
    const result = await session.run(getSourceOfLowBySolIds, { solIds });

    if (result && result.records.length > 0) {
      result.records.map((record) => {
        const sl = common.getPropertiesFromRecord(record, "sl");
        const obj = {
          sol_id: sl.sol_id,
        };
        if (record.get("sls") && record.get("sls").length > 0) {
          record.get("sls").forEach((slState) => {
            if (
              slState.lang &&
              slState.sls &&
              slState.lang.properties.iso_639_1
            ) {
              obj[slState.lang.properties.iso_639_1] =
                slState.sls.properties.sol_link;
            }
          });
        }
        resultOfSol.push(obj);
        return obj;
      });
    }
    return resultOfSol;
  } catch (error) {
    console.log(error);
    session.close();
    return resultOfSol;
  }
};

const replaceIdToLinkInContent = (nl, sourceLink) => {
  sourceLink.forEach((link) => {
    let lang = "";
    const solId = link.sol_id;
    if (nl.nls.de && nl.nls.de.nl_text) {
      if (link.de) {
        lang = "de";
      } else if (link.en) {
        lang = "en";
      }
      nl.nls.de.nl_text = nl.nls.de.nl_text.replace(
        `[*NQ*${solId}*]"`,
        `${link[lang]}" target="_blank"`
      );
      nl.nls.de.nl_text = nl.nls.de.nl_text.replace(
        `[NQ*${solId}*]"`,
        `${link[lang]}" target="_blank"`
      );
      nl.nls.de.nl_text = nl.nls.de.nl_text.replace(
        `[*NQ*${solId}**]"`,
        `${link[lang]}" target="_blank"`
      );
    }
    if (nl.nls.en && nl.nls.en.nl_text) {
      if (link.en) {
        lang = "en";
      } else if (link.de) {
        lang = "de";
      }
      nl.nls.en.nl_text = nl.nls.en.nl_text.replace(
        `[*NQ*${solId}*]"`,
        `${link[lang]}" target="_blank"`
      );
      nl.nls.en.nl_text = nl.nls.en.nl_text.replace(
        `[NQ*${solId}*]"`,
        `${link[lang]}" target="_blank"`
      );
      nl.nls.en.nl_text = nl.nls.en.nl_text.replace(
        `[*NQ*${solId}**]"`,
        `${link[lang]}" target="_blank"`
      );
    }
  });
};

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  let userEmail = null;
  if (user) {
    userEmail = user.user_email;
  }
  const solIds = [];
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
      if (
        !nlId &&
        response.nl_first.nls.en &&
        response.nl_first.nls.en.nl_text
      ) {
        solIds.push(...common.nqTransform(response.nl_first.nls.en.nl_text));
      }
      if (
        !nlId &&
        response.nl_first.nls.de &&
        response.nl_first.nls.de.nl_text
      ) {
        solIds.push(...common.nqTransform(response.nl_first.nls.de.nl_text));
      }
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
                solIds.push(
                  ...common.nqTransform(
                    nls[nlState.lang.properties.iso_639_1].nl_text
                  )
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
    if (response.nl_first) {
      const arrayOfSourceOfLaw = await getSourceOfLaw(_.uniq(solIds));
      if (arrayOfSourceOfLaw.length > 0) {
        replaceIdToLinkInContent(response.nl_first, arrayOfSourceOfLaw);
      }
      if (userEmail) {
        common.loggingData(logNewsletter, {
          type: constants.LOG_TYPE_ID.READ_NL,
          current_user_email: userEmail,
          nl_id: response.nl_first.nl.nl_id || null,
        });
      }
    }
    return response;
  } catch (error) {
    session.close();
    throw error;
  }
};
