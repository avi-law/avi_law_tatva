/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { APIError, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { getUserFavorites } = require("../../../neo4j/user-query");

const getUniqueRuleElementState = (allRuleElementState) => {
  if (allRuleElementState.length === 0) {
    return allRuleElementState;
  }
  const uniqueObject = {};
  if (allRuleElementState.length > 0) {
    allRuleElementState.forEach((element) => {
      const { identity, version_of_id: versionOfId } = element;
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

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userEmail = user.user_email;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const session = driver.session();
  const favoriteData = [];
  try {
    if (!userEmail) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const favoriteResult = await session.run(getUserFavorites, {
      user_email: userEmail,
    });
    if (favoriteResult && favoriteResult.records.length > 0) {
      favoriteResult.records.forEach((record) => {
        const fav = record.get("favorites");
        favoriteData.push(...fav);
      });
      const allRuleElementState = _.filter(favoriteData, {
        favoriteType: constants.FAVORITE_TYPE.RULE_ELEMENT_STATE,
      });
      const allRuleBook = _.filter(favoriteData, {
        favoriteType: constants.FAVORITE_TYPE.RULE_BOOK,
      });
      const uniqueRuleElementState = getUniqueRuleElementState(
        allRuleElementState
      );
      const uniqueRuleBook = getUniqueRuleBook(allRuleBook);
      let finalArray = uniqueRuleElementState.concat(uniqueRuleBook);
      finalArray = _.orderBy(
        finalArray,
        ["de.favOrder", "en.favOrder"],
        ["asc", "asc"]
      );
      return finalArray;
    }
    return [];
  } catch (error) {
    session.close();
    throw error;
  } finally {
    session.close();
  }
};
