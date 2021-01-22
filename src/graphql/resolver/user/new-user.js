/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError, common, auth, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  newUser,
  getUserByEmail,
  logUserByAdmin,
} = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const systemAdmin = user.user_is_sys_admin || null;
  const userEmail = user.user_email || null;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const userState = params.data.user_state || null;
  const userDetails = params.data.user || null;
  try {
    if (!systemAdmin || !userState) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    if (userDetails && userDetails.user_email) {
      const checkEmailresult = await session.run(getUserByEmail, {
        user_email: userDetails.user_email,
      });
      if (checkEmailresult && checkEmailresult.records.length > 0) {
        throw new APIError({
          lang: userSurfLang,
          message: "EMAIL_ALREADY_EXISTS",
        });
      }
    }
    const pwd = userState.user_pwd;
    const encryptedPassword = await auth.hashPassword(pwd);
    userState.user_pwd = encryptedPassword;
    const queryParams = {
      user_email: userDetails.user_email,
      user: userDetails,
      user_pref_surf_lang_iso_639_1: params.data.user_pref_surf_lang_iso_639_1,
      user_pref_1st_lang_iso_639_1: params.data.user_pref_1st_lang_iso_639_1,
      user_pref_2nd_lang_iso_639_1: params.data.user_pref_2nd_lang_iso_639_1,
      user_pref_country_iso_3166_1_alpha_2:
        params.data.user_pref_country_iso_3166_1_alpha_2,
      user_want_nl_from_country_iso_3166_1_alpha_2:
        params.data.user_want_nl_from_country_iso_3166_1_alpha_2,
      user_state: common.cleanObject(userState),
      user_is_sys_admin: null,
      user_is_author: null,
    };
    queryParams.user_want_nl_from_country_iso_3166_1_alpha_2.push("EU");
    if (typeof params.data.user_is_sys_admin === "boolean") {
      queryParams.user_is_sys_admin = params.data.user_is_sys_admin;
    }
    if (typeof params.data.user_is_author === "boolean") {
      queryParams.user_is_author = params.data.user_is_author;
    }
    // console.log(queryParams);
    // return true;
    const result = await session.run(newUser, queryParams);
    if (result && result.records.length > 0) {
      if (systemAdmin) {
        common.loggingData(logUserByAdmin, {
          type: constants.LOG_TYPE_ID.CREATE_USER,
          current_user_email: userEmail,
          user_email: userDetails.user_email,
        });
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
