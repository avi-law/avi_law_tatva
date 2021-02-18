/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { deleteNewsletterEmail } = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userIsSysAdmin = user.user_is_sys_admin || false;
  const userIsAuthor = user.user_is_author || false;
  params = JSON.parse(JSON.stringify(params));
  const nlEmailOrd = params.nl_email_ord;
  const session = driver.session();
  try {
    if ((!userIsSysAdmin && !userIsAuthor) || !nlEmailOrd) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const result = await session.run(deleteNewsletterEmail, {
      nl_email_ord: nlEmailOrd,
    });
    if (result && result.records.length > 0) {
      session.close();
      return true;
    }
    console.error("Error: Newsletter Email not found");
    throw new APIError({
      lang: defaultLanguage,
      message: "INTERNAL_SERVER_ERROR",
    });
  } catch (error) {
    session.close();
    throw error;
  }
};
