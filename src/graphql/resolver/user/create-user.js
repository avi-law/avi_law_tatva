/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError, common } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { createUser, getUser, getUserByEmail } = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const systemAdmin = user.user_is_sys_admin || null;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const userEmail = params.user_email;
  const userState = params.data.user_state || null;
  const userDetails = params.data.user || null;
  let isChangeEmail = false;
  try {
    if (!userState) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    if (userEmail !== userDetails.user_email) {
      const checkEmailresult = await session.run(getUserByEmail, {
        user_email: userDetails.user_email,
      });
      if (checkEmailresult && checkEmailresult.records.length > 0) {
        throw new APIError({
          lang: userSurfLang,
          message: "EMAIL_ALREADY_EXISTS",
        });
      }
      isChangeEmail = true;
    }
    const oldUserStateResult = await session.run(getUser, {
      user_email: userEmail,
    });
    if (oldUserStateResult && oldUserStateResult.records) {
      const userData = oldUserStateResult.records.map((record) => {
        const userResult = {
          user: common.getPropertiesFromRecord(record, "u"),
          user_state: common.getPropertiesFromRecord(record, "us"),
        };
        return userResult;
      });
      const userStatedetails = userData[0];
      // userState.user_gdpr_accepted = userStatedetails.user_gdpr_accepted;
    } else {
      console.error("Customer details not found");
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const queryParams = {
      user: userDetails,
      user_pref_surf_lang_iso_639_1: params.data.user_pref_surf_lang_iso_639_1,
      user_pref_1st_lang_iso_639_1: params.data.user_pref_1st_lang_iso_639_1,
      user_pref_2nd_lang_iso_639_1: params.data.user_pref_2nd_lang_iso_639_1,
      user_pref_country_iso_3166_1_alpha_2:
        params.data.user_pref_country_iso_3166_1_alpha_2,
      user_want_nl_from_country_iso_3166_1_alpha_2:
        params.data.user_want_nl_from_country_iso_3166_1_alpha_2,
      user_state: common.cleanObject(userState),
    };

    if (systemAdmin) {
      if (isChangeEmail) {
        queryParams.email = params.data.user.user_email;
      }
      if (params.data.user_acronym) {
        queryParams.user_acronym = params.data.user_acronym;
      }
      if (params.data.user_is_sys_admin) {
        queryParams.user_is_sys_admin = params.data.user_is_sys_admin;
      }
      if (params.data.user_is_sys_admin) {
        queryParams.user_is_author = params.data.user_is_author;
      }
    }
    console.log(queryParams);
    return true;
    const result = await session.run(createUser, queryParams);
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
