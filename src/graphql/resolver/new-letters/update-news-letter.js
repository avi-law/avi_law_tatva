/* eslint-disable no-param-reassign */

const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { newsletterQuery, logNewsletter } = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const systemAdmin = user.user_is_sys_admin || null;
  const userIsAuthor = user.user_is_author || null;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userEmail = user.user_email || null;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const { data } = params;
  const nlID = params.nl_id;
  const isValidDE = true;
  const isValidEN = true;
  try {
    if (!systemAdmin && !userIsAuthor) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    data.nl.nl_id = nlID;
    if (!data.nl.nl_implemented) {
      data.nl.nl_implemented = false;
    }
    if (!data.nl.nl_active) {
      data.nl.nl_implemented = false;
    }
    const queryParams = {
      isUpdate: true,
      user_email: userEmail,
      nl: data.nl,
      nls: data.nls,
      country: data.country,
      isValidDE,
      isValidEN,
    };
    const result = await session.run(newsletterQuery(queryParams));
    if (result && result.records.length > 0) {
      common.loggingData(logNewsletter, {
        type: constants.LOG_TYPE_ID.UPDATE_NL,
        current_user_email: userEmail,
        nl_id: nlID,
      });
      return true;
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
