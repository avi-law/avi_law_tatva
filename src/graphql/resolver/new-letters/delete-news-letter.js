/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError, constants, common } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  deleteNewsletter,
  logDeleteNewsletter,
} = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userEmail = user.user_email || null;
  const userIsSysAdmin = user.user_is_sys_admin || false;
  params = JSON.parse(JSON.stringify(params));
  const nlID = params.nl_id;
  const session = driver.session();
  try {
    if (!userIsSysAdmin) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const result = await session.run(deleteNewsletter, {
      nl_id: nlID,
    });
    if (result && result.records.length > 0) {
      session.close();
      common.loggingData(logDeleteNewsletter, {
        type: constants.LOG_TYPE_ID.DELETE_NL,
        current_user_email: userEmail,
      });
      return true;
    }
    console.error("Error: Newsletter not found");
    throw new APIError({
      lang: defaultLanguage,
      message: "INTERNAL_SERVER_ERROR",
    });
  } catch (error) {
    session.close();
    throw error;
  }
};
