/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { common } = require("../../../utils");
const {
  getNewsletterDetails,
  getSourceOfLowBySolIds,
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
    if (nl.nls.de && nl.nls.de.nl_text && link.de) {
      nl.nls.de.nl_text = nl.nls.de.nl_text.replace(
        `[*NQ*${link.sol_id}*]"`,
        `${link.de}" target="_blank"`
      );
      nl.nls.de.nl_text = nl.nls.de.nl_text.replace(
        `[NQ*${link.sol_id}*]"`,
        `${link.de}" target="_blank"`
      );
    }
    if (nl.nls.en && nl.nls.en.nl_text && link.en) {
      nl.nls.en.nl_text = nl.nls.en.nl_text.replace(
        `[*NQ*${link.sol_id}*]"`,
        `${link.en}" target="_blank"`
      );
      nl.nls.en.nl_text = nl.nls.en.nl_text.replace(
        `[NQ*${link.sol_id}*]"`,
        `${link.en}" target="_blank"`
      );
    }
  });
};

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userEmail = user.user_email || null;
  const nlId = params.nl_id;
  const solIds = [];
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

      if (nlResultDetailsArray[0]) {
        const arrayOfSourceOfLaw = await getSourceOfLaw(_.uniq(solIds));
        if (arrayOfSourceOfLaw.length > 0) {
          replaceIdToLinkInContent(nlResultDetailsArray[0], arrayOfSourceOfLaw);
        }
      }
      return nlResultDetailsArray[0];
    }
    return null;
  } catch (error) {
    session.close();
    throw error;
  }
};
