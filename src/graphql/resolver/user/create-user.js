/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { APIError, common, auth, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  createUser,
  getUser,
  getUserByEmail,
  logUserByAdmin,
  logUser,
} = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const systemAdmin = user.user_is_sys_admin || null;
  const loginUserEmail = user.user_email || null;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const userEmail = params.user_email;
  let userState = params.data.user_state || null;
  const userDetails = params.data.user || null;
  let isChangeEmail = false;
  let userStatedetails = null;
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
      userStatedetails = userData[0];
      if (userState.user_pwd && params.data.user_pwd_old) {
        if (
          !auth.comparePassword(
            userStatedetails.user_state.user_pwd,
            params.data.user_pwd_old
          )
        ) {
          throw new APIError({
            lang: defaultLanguage,
            message: "INCORRECT_OLD_PASSWORD",
          });
        }
        userState.user_pwd = await auth.hashPassword(userState.user_pwd);
        // userState.user_pwd_old = userState.user_pwd;
      }
      if (!userState.user_login_count) {
        userState.user_login_count = 0;
      }
      if (!userState.user_last_login) {
        userState.user_last_login = null;
      }
      userState = {
        ...userStatedetails.user_state,
        ...userState,
      };
    } else {
      console.error("Customer details not found");
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const queryParams = {
      user_email: userEmail,
      user: userDetails,
      user_pref_surf_lang_iso_639_1: params.data.user_pref_surf_lang_iso_639_1,
      user_pref_1st_lang_iso_639_1: params.data.user_pref_1st_lang_iso_639_1,
      user_pref_2nd_lang_iso_639_1: params.data.user_pref_2nd_lang_iso_639_1,
      user_pref_country_iso_3166_1_alpha_2:
        params.data.user_pref_country_iso_3166_1_alpha_2,
      user_want_nl_from_country_iso_3166_1_alpha_2:
        params.data.user_want_nl_from_country_iso_3166_1_alpha_2,
      user_state: common.cleanObject(_.cloneDeep(userState)),
      user_is_author: userStatedetails.user.user_is_author || null,
      user_acronym: userStatedetails.user_state.user_acronym,
      user_is_sys_admin: userStatedetails.user.user_is_sys_admin || null,
      email: userEmail,
    };
    queryParams.user_want_nl_from_country_iso_3166_1_alpha_2.push("EU");
    if (isChangeEmail) {
      queryParams.email = params.data.user.user_email;
    }
    if (systemAdmin) {
      if (params.data.user_acronym) {
        queryParams.user_state.user_acronym = params.data.user_acronym;
      }
      if (typeof params.data.user_is_sys_admin === "boolean") {
        queryParams.user_is_sys_admin = params.data.user_is_sys_admin;
      }
      if (typeof params.data.user_is_author === "boolean") {
        queryParams.user_is_author = params.data.user_is_author;
      }
    }
    const result = await session.run(createUser, queryParams);
    if (result && result.records.length > 0) {
      const logObject = {
        type: constants.LOG_TYPE_ID.UPDATE_USER,
        current_user_email: loginUserEmail,
      };
      if (systemAdmin) {
        logObject.user_email = userEmail;
        common.loggingData(logUserByAdmin, logObject);
      } else {
        common.loggingData(logUser, logObject);
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
