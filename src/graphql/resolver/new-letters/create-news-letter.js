/* eslint-disable no-param-reassign */

const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { newsletterQuery, logNewsletter } = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const systemAdmin = user.user_is_sys_admin || null;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userEmail = user.user_email || null;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const { data } = params;
  let isValidDE = false;
  let isValidEN = false;
  try {
    if (!systemAdmin) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    data.nls = common.cleanObject(data.nls);
    if (
      data.nls &&
      data.nls.nl_text_de &&
      data.nls.nl_title_long_de &&
      data.nls.nl_title_short_de
    ) {
      isValidDE = true;
    }
    if (
      data.nls &&
      data.nls.nl_text_en &&
      data.nls.nl_title_long_en &&
      data.nls.nl_title_short_en
    ) {
      isValidEN = true;
    }
    const queryParams = {
      nl: data.nl,
      nls: data.nls,
      country: data.country,
      isValidDE,
      isValidEN,
    };
    console.log(newsletterQuery(queryParams));
    return true;
    const result = await session.run(newsletterQuery(queryParams));
    if (result && result.records.length > 0) {
      common.loggingData(logNewsletter, {
        type: constants.LOG_TYPE_ID.CREATE_NL,
        current_user_email: userEmail,
        nl_id: 1,
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
