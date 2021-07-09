/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  userCreateFavorite,
  userDeleteFavorite,
} = require("../../../neo4j/user-query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userEmail = user.user_email;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const { identity, isCreate } = params;
  try {
    if (!userEmail) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const query = isCreate ? userCreateFavorite : userDeleteFavorite;
    const favoriteResult = await session.run(query, {
      user_email: userEmail,
      identity,
    });
    if (favoriteResult && favoriteResult.records.length > 0) {
      return true;
    }
    return false;
  } catch (error) {
    session.close();
    throw error;
  } finally {
    session.close();
  }
};
