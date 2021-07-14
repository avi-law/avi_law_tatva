/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  userCreateFavorite,
  userDeleteFavorite,
  userCreateFavoriteRuleBook,
  userDeleteFavoriteRuleBook,
} = require("../../../neo4j/user-query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userEmail = user.user_email;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const { identity, isCreate, favoriteType } = params;
  try {
    if (!userEmail) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    let query = "";
    if (constants.FAVORITE_TYPE.RULE_BOOK === favoriteType) {
      query = isCreate
        ? userCreateFavoriteRuleBook
        : userDeleteFavoriteRuleBook;
    } else if (constants.FAVORITE_TYPE.RULE_ELEMENT_STATE === favoriteType) {
      query = isCreate ? userCreateFavorite : userDeleteFavorite;
    }
    const favoriteResult = await session.run(query, {
      user_email: userEmail,
      identity,
    });
    if (favoriteResult && favoriteResult.records.length > 0) {
      return true;
    }
    throw new APIError({
      lang: userSurfLang,
      message: "INTERNAL_SERVER_ERROR",
    });
  } catch (error) {
    session.close();
    throw error;
  } finally {
    session.close();
  }
};
