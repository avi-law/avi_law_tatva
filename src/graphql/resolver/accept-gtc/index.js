const driver = require("../../../config/db");
const { defaultLanguage } = require("../../../config/application");
const { constants, auth, common, APIError } = require("../../../utils");
const {
  getUserStateInformationQUery,
  getCommonUserStateLogginQuery,
  manageLoginCountQuery,
  logICustomerGTCQuery,
  updateGTCAccept,
} = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang;
  const email = user.user_email;
  const { accept } = params;
  const session = driver.session();
  let loginStatus = false;
  let loginFailedCode = null;
  try {
    // If GTC not accept send error message to FE
    if (!accept) {
      common.loggingData(getCommonUserStateLogginQuery(), {
        type: constants.LOG_TYPE_ID.ADMIN_USER_GTC_NOT_ACCEPTED,
        user_email: email,
      });
      common.loggingData(logICustomerGTCQuery, {
        type: constants.LOG_TYPE_ID.ADMIN_CUSTOMER_GTC_NOT_ACCEPTED,
        user_email: email,
      });
      throw new APIError({
        lang: defaultLanguage,
        message: "GTC_NOT_ACCEPTED",
      });
    }
    // Update status of gtc accepted and add log
    await session.run(updateGTCAccept, { user_email: email }).then(() => {
      common.loggingData(
        getCommonUserStateLogginQuery("log_par_01: $user_email"),
        {
          type: constants.LOG_TYPE_ID.GTC_ACCEPTED,
          user_email: email,
        }
      );
      common.loggingData(logICustomerGTCQuery, {
        type: constants.LOG_TYPE_ID.ADMIN_CUSTOMER_GTC_ACCEPTED,
        user_email: email,
      });
    });

    const userStateInformation = await session
      .run(getUserStateInformationQUery, { user_email: email })
      .then((result) => {
        if (result && result.records) {
          const singleRecord = result.records[0];
          return singleRecord.get(0);
        }
        throw new APIError({
          lang: defaultLanguage,
          message: "INVALID_REQUEST",
        });
      });

    if (!userStateInformation.user_gdpr_accepted) {
      loginFailedCode = constants.LOGIN_FAILED_STATUS.GDPR_NOT_ACCEPTED;
      return {
        loginStatus,
        loginFailedCode,
        loginMessage: common.getMessage(loginFailedCode, userSurfLang).message,
        user: null,
        lang: userSurfLang,
        token: auth.generateToken({
          login_status: loginStatus,
          login_failed_code: loginFailedCode,
          user_id: userStateInformation.user_id,
          user_sex: userStateInformation.user_sex,
          user_first_name: userStateInformation.user_first_name,
          user_last_name: userStateInformation.user_last_name,
          user_email: userStateInformation.user_email,
          user_surf_lang: userSurfLang,
          user_pref_country: userStateInformation.user_pref_country,
          user_is_sys_admin: userStateInformation.user_is_sys_admin,
          user_is_author: userStateInformation.user_is_author,
        }),
      };
    }
    // Log success login query
    common.loggingData(getCommonUserStateLogginQuery(), {
      type: constants.LOG_TYPE_ID.LOGIN_SUCCESS,
      user_email: email,
    });
    await session.run(manageLoginCountQuery, { user_email: email });
    loginStatus = true;
    return {
      loginStatus,
      loginFailedCode,
      loginMessage: common.getMessage("LOGIN_SUCCESS", userSurfLang).message,
      lang: userSurfLang,
      user: userStateInformation,
      token: auth.generateToken({
        login_status: true,
        login_failed_code: loginFailedCode,
        user_id: userStateInformation.user_id,
        user_email: userStateInformation.user_email,
        user_surf_lang: userSurfLang,
        user_sex: userStateInformation.user_sex,
        user_first_name: userStateInformation.user_first_name,
        user_last_name: userStateInformation.user_last_name,
        user_pref_country: userStateInformation.user_pref_country,
        user_is_sys_admin: userStateInformation.user_is_sys_admin,
        user_is_author: userStateInformation.user_is_author,
      }),
    };
  } catch (error) {
    session.close();
    throw error;
  } finally {
    session.close();
  }
};
