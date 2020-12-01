const _ = require("lodash");
const driver = require("../../../config/db");
const { constants, auth, common } = require("../../../utils");

const {
  getUserStateInformationQUery,
  getCommonUserStateLogginQuery,
  manageLoginCountQuery,
  updateGDPRAccept,
} = require("../../../neo4j/query");

module.exports = async (object, params, ctx, info) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang;
  const email = user.user_email;
  const { accept } = params;
  const session = driver.session();
  let loginStatus = false;
  const loginFailedCode = null;
  try {
    // If GDPR not accept send error message to FE
    if (!accept) {
      await session.run(getCommonUserStateLogginQuery(), {
        type: constants.LOG_TYPE_ID.GDPR_NOT_ACCEPTED,
        user_email: email,
      });
      throw new Error(common.getMessage("GDPR_NOT_ACCEPTED"), userSurfLang);
    }
    const userStateInformation = await session
      .run(getUserStateInformationQUery, { user_email: email })
      .then((result) => {
        if (result && result.records) {
          const singleRecord = result.records[0];
          return singleRecord.get(0);
        }
        throw new Error(common.getMessage("INVALID_REQUEST"));
      });
    // Update status of GDPR accepted and add log
    await session.run(updateGDPRAccept, { email }).then(() =>
      session.run(getCommonUserStateLogginQuery("log_par_01: $user_email"), {
        type: constants.LOG_TYPE_ID.GDPR_ACCEPTED,
        user_email: email,
      })
    );
    // Log success login query
    await session.run(getCommonUserStateLogginQuery(), {
      type: constants.LOG_TYPE_ID.LOGIN_SUCCESS,
      user_email: email,
    });
    await session.run(manageLoginCountQuery, { user_email: email });
    loginStatus = true;
    session.close();
    return {
      loginStatus,
      loginFailedCode,
      loginMessage: common.getMessage("LOGIN_SUCCESS", userSurfLang),
      lang: userSurfLang,
      user: userStateInformation,
      token: auth.generateToken({
        login_status: true,
        login_failed_code: loginFailedCode,
        user_id: userStateInformation.user_id,
        user_email: userStateInformation.user_email,
        user_surf_lang: userSurfLang,
        user_pref_country: userStateInformation.user_pref_country,
      }),
    };
  } catch (error) {
    session.close();
    throw error;
  }
};
