/* eslint-disable no-param-reassign */
const driver = require("../../../config/db");
const { APIError } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { getUserByEmail } = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const userEmail = params.user_email;
  let isChangeEmail = false;
  try {
    if (userEmail) {
      const checkEmailresult = await session.run(getUserByEmail, {
        user_email: userEmail,
      });
      if (checkEmailresult && checkEmailresult.records.length > 0) {
        isChangeEmail = true;
      }
      return isChangeEmail;
    }
    throw new APIError({
      lang: userSurfLang,
      message: "INTERNAL_SERVER_ERROR",
    });
  } catch (error) {
    session.close();
    throw error;
  }
};
