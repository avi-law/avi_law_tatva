/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { APIError, constants } = require("../../../utils");
const { getUserHistoryLogList } = require("../../../neo4j/user-query");
const { defaultLanguage } = require("../../../config/application");

const getUniqueRuleElementState = (allRuleElementState) => {
  if (allRuleElementState.length === 0) {
    return allRuleElementState;
  }
  const uniqueObject = {};
  if (allRuleElementState.length > 0) {
    allRuleElementState.forEach((element) => {
      const { version_of_id: versionOfId } = element;
      const { identity } = element.res;
      let key = `${identity}_${versionOfId}`;
      if (element.iso_639_1 === "en") {
        key = `${versionOfId}_${identity}`;
      }
      if (!uniqueObject[key]) {
        uniqueObject[key] = { de: null, en: null };
        uniqueObject[key][element.iso_639_1] = null;
      }
      uniqueObject[key][element.iso_639_1] = element;
    });
  }
  return _.values(uniqueObject);
};

const getUniqueRuleBook = (allRuleBook) => {
  if (allRuleBook.length === 0) {
    return allRuleBook;
  }
  const uniqueObject = {};
  if (allRuleBook.length > 0) {
    allRuleBook.forEach((element) => {
      const { identity } = element;
      if (!uniqueObject[identity]) {
        uniqueObject[identity] = { de: null, en: null };
        uniqueObject[identity][element.iso_639_1] = null;
      }
      uniqueObject[identity][element.iso_639_1] = element;
    });
  }
  return _.values(uniqueObject);
};

const getUniqueNl = (allNl) => {
  if (allNl.length === 0) {
    return allNl;
  }
  const uniqueObject = {};
  if (allNl.length > 0) {
    allNl.forEach((element) => {
      const { nl_id: nlId } = element.nl.nl;
      if (!uniqueObject[nlId]) {
        uniqueObject[nlId] = { de: null, en: null };
        uniqueObject[nlId][element.iso_639_1] = null;
      }
      uniqueObject[nlId][element.iso_639_1] = element;
    });
  }
  return _.values(uniqueObject);
};

module.exports = async (object, params, ctx) => {
  params = JSON.parse(JSON.stringify(params));
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userEmail = user.user_email || null;
  const session = driver.session();
  const logData = [];
  let finalArray = [];
  const limit = params.first || 20;
  try {
    if (!userEmail) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const result = await session.run(getUserHistoryLogList(), {
      user_email: userEmail,
      limit: limit * 3,
    });
    if (result && result.records.length > 0) {
      result.records.forEach((record) => {
        const logs = record.get("logs");
        logData.push(...logs);
      });
    }
    const allRuleElementState = _.orderBy(
      _.filter(logData, {
        label: constants.LOG_REFERS_TO_OBJECT_LABEL.RULE_ELEMENT_STATE,
      }),
      ["log.log_timestamp", "log.identity"],
      ["asc", "asc"]
    );
    const allRuleBook = _.orderBy(
      _.filter(logData, {
        label: constants.LOG_REFERS_TO_OBJECT_LABEL.RULE_BOOK,
      }),
      ["log.log_timestamp", "log.identity"],
      ["asc", "asc"]
    );
    const allNl = _.orderBy(
      _.filter(logData, {
        label: constants.LOG_REFERS_TO_OBJECT_LABEL.NL,
      }),
      ["log.log_timestamp", "log.identity"],
      ["asc", "asc"]
    );
    const uniqueRuleElementState = getUniqueRuleElementState(
      allRuleElementState
    );
    const uniqueRuleBook = getUniqueRuleBook(allRuleBook);
    const uniqueNL = getUniqueNl(allNl);

    finalArray = finalArray.concat(uniqueRuleElementState);
    finalArray = finalArray.concat(uniqueRuleBook);
    finalArray = finalArray.concat(uniqueNL);

    finalArray = _.orderBy(
      finalArray,
      ["de.log.log_timestamp", "en.log.identity"],
      ["desc", "desc"]
    );
    const sliceArray = _.chunk(finalArray, limit);
    return {
      logs: sliceArray[0],
    };
  } catch (error) {
    session.close();
    throw error;
  } finally {
    session.close();
  }
};
