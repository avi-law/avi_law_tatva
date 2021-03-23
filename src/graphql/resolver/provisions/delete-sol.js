/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { deleteSol, logDeleteSol } = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userIsSysAdmin = user.user_is_sys_admin || false;
  const userIsAuthor = user.user_is_author || false;
  const userEmail = user.user_email || null;
  params = JSON.parse(JSON.stringify(params));
  const slId = params.sol_id;
  const session = driver.session();
  try {
    if ((!userIsSysAdmin && !userIsAuthor) || Number.isNaN(slId)) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const result = await session.run(deleteSol, {
      sol_id: Number(slId),
    });
    if (result && result.records.length > 0) {
      session.close();
      common.loggingData(logDeleteSol, {
        type: constants.LOG_TYPE_ID.DELETE_SOL,
        current_user_email: userEmail,
      });
      return true;
    }
    console.error("Error:Sol not found");
    throw new APIError({
      lang: userSurfLang,
      message: "INTERNAL_SERVER_ERROR",
    });
  } catch (error) {
    session.close();
    throw error;
  }
};
