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
  let isValidDE = false;
  let isValidEN = false;
  try {
    if (!systemAdmin && !userIsAuthor) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    if (data.nls) {
      if (data.nls.de) {
        data.nls.de = common.cleanObject(data.nls.de);
      }
      if (data.nls.en) {
        data.nls.en = common.cleanObject(data.nls.en);
      }
    }

    if (
      data.nls &&
      data.nls.de &&
      data.nls.de.nl_text &&
      data.nls.de.nl_title_long &&
      data.nls.de.nl_title_short
    ) {
      isValidDE = true;
    }
    if (
      data.nls &&
      data.nls.en &&
      data.nls.en.nl_text &&
      data.nls.en.nl_title_long &&
      data.nls.en.nl_title_short
    ) {
      isValidEN = true;
    }
    if (!data.nl.nl_implemented) {
      data.nl.nl_implemented = false;
    }
    if (!data.nl.nl_active) {
      data.nl.nl_active = false;
    }
    const queryParams = {
      isUpdate: false,
      user_email: userEmail,
      nl: data.nl,
      nls: data.nls,
      country: data.country,
      isValidDE,
      isValidEN,
    };
    const result = await session.run(newsletterQuery(queryParams), {
      queryParams,
    });
    if (result && result.records.length > 0) {
      const newsLetters = result.records.map((record) => {
        const nlResult = {
          ...common.getPropertiesFromRecord(record, "nl"),
        };
        return nlResult;
      });
      common.loggingData(logNewsletter, {
        type: constants.LOG_TYPE_ID.CREATE_NL,
        current_user_email: userEmail,
        nl_id: newsLetters[0].nl_id || null,
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
