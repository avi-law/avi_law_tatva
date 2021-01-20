/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { common, APIError } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { getUsersCountQuery, getUsersQuery } = require("../../../neo4j/query");

/**
 *
 *
 * @param {*} object
 * @param {*} params
 * @returns
 */
module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  params = JSON.parse(JSON.stringify(params));
  const session = driver.session();
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userIsSysAdmin = user.user_is_sys_admin || false;
  try {
    if (!userIsSysAdmin) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const result = await session.run(
      `MATCH (u:User)
      RETURN u.user_email as user_email
      ORDER BY toLower(u.user_email) ASC`
    );
    if (result && result.records.length > 0) {
      const usersEmail = result.records.map((record) => {
        const email = {
          user_email: record.get("user_email"),
        };
        return email;
      });
      return usersEmail;
    }
    session.close();
    return [];
  } catch (error) {
    session.close();
    throw error;
  }
};
