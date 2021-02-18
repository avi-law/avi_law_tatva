/* eslint-disable no-param-reassign */

const driver = require("../../../config/db");
const { APIError, common } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { newsletterEmailQuery } = require("../../../neo4j/query");
const generateNewsLetterEmailOrder = require("./generate-news-letter-email-order");

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
    if (data.nles) {
      if (data.nles.de) {
        data.nles.de = common.cleanObject(data.nles.de);
      }
      if (data.nles.en) {
        data.nles.en = common.cleanObject(data.nles.en);
      }
    }

    if (data.nles && data.nles.de.nl_email_subject) {
      isValidDE = true;
    }
    if (data.nles && data.nles.en.nl_email_subject) {
      isValidEN = true;
    }
    data.nle.nl_email_ord = await generateNewsLetterEmailOrder();
    data.nle.nl_email_date = common.convertToTemporalDate();
    const queryParams = {
      isUpdate: false,
      user_email: userEmail,
      nle: data.nle,
      nles: data.nles,
      nl_tags: data.nl_tags,
      isValidDE,
      isValidEN,
    };
    const result = await session.run(newsletterEmailQuery(queryParams));
    if (result && result.records.length > 0) {
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
