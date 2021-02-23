/* eslint-disable no-param-reassign */

const _ = require("lodash");
const driver = require("../../../config/db");
const { APIError, common } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const sendNewsletterToUser = require("./nl-send-email-to-user");
const {
  newsletterEmailQuery,
  getNewsletterEmail,
} = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const systemAdmin = user.user_is_sys_admin || null;
  const userIsAuthor = user.user_is_author || null;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userEmail = user.user_email || null;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const { data } = params;
  const nlEmailOrd = params.nl_email_ord;
  let isValidDE = false;
  let isValidEN = false;
  let isSent = false;
  let isSentSuccess = false;
  try {
    if (!systemAdmin && !userIsAuthor) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const isAlreadySent = await session.run(getNewsletterEmail, {
      nl_email_ord: nlEmailOrd,
    });
    if (isAlreadySent && isAlreadySent.records.length > 0) {
      const isAlreadySentArray = isAlreadySent.records.map((record) => {
        const nlResult = {
          ...common.getPropertiesFromRecord(record, "nle"),
        };
        return nlResult;
      });
      if (
        isAlreadySentArray.length > 0 &&
        isAlreadySentArray[0].nl_email_sent
      ) {
        throw new APIError({
          lang: defaultLanguage,
          message: "NL_EMAIL_ALREADY_SENT",
        });
      }
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
    if (data.nle) {
      isSent = data.nle.nl_email_sent;
    }
    data.nle.nl_email_ord = nlEmailOrd;
    data.nle.nl_email_date = common.convertToTemporalDate();
    const queryParams = {
      isUpdate: true,
      user_email: userEmail,
      nle: data.nle,
      nles: data.nles,
      nl_tags: data.nl_tags,
      isValidDE,
      isValidEN,
    };
    const result = await session.run(newsletterEmailQuery(queryParams), {
      queryParams,
    });
    if (result && result.records.length > 0) {
      if (isSent) {
        await sendNewsletterToUser(queryParams);
      }
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
