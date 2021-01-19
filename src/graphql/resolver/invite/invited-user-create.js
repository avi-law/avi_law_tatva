/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { APIError, common, auth, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const sendMail = require("../../../libs/email");
const {
  invitationAcceptedByUser,
  getUserByEmail,
  getUserByInvitationToken,
} = require("../../../neo4j/query");

module.exports = async (object, params) => {
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const token = params.token;
  let userState = params.data.user_state || null;
  const userDetails = params.data.user || null;
  let isChangeEmail = false;
  let userStatedetails = null;
  let invitedUserEmail = null;
  try {
    if (!userState || !token) {
      throw new APIError({
        lang: defaultLanguage,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const oldUserStateResult = await session.run(getUserByInvitationToken, {
      token,
    });
    if (oldUserStateResult && oldUserStateResult.records.length > 0) {
      const userData = oldUserStateResult.records.map((record) => {
        const userResult = {
          user: common.getPropertiesFromRecord(record, "u"),
          user_state: common.getPropertiesFromRecord(record, "us"),
          user_by_invited: common.getPropertiesFromRecord(record, "ui"),
        };
        return userResult;
      });
      userStatedetails = userData[0];
      invitedUserEmail = userStatedetails.user_by_invited.user_email || null;
      if (userState.user_pwd) {
        userState.user_pwd = await auth.hashPassword(userState.user_pwd);
      }
      userState.user_login_count = 0;
      userState.user_last_login = null;
      userState = {
        ...userStatedetails.user_state,
        ...userState,
      };
    } else {
      console.error("Customer details not found");
      throw new APIError({
        lang: defaultLanguage,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    if (
      userStatedetails &&
      userStatedetails.user.user_email !== userDetails.user_email
    ) {
      const checkEmailresult = await session.run(getUserByEmail, {
        user_email: userDetails.user_email,
      });
      if (checkEmailresult && checkEmailresult.records.length > 0) {
        throw new APIError({
          lang: defaultLanguage,
          message: "EMAIL_ALREADY_EXISTS",
        });
      }
      isChangeEmail = true;
    }
    const queryParams = {
      user_email:
        (userStatedetails && userStatedetails.user.user_email) || null,
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
      email: null,
    };
    queryParams.user_want_nl_from_country_iso_3166_1_alpha_2.push("EU");
    if (isChangeEmail) {
      queryParams.email = params.data.user.user_email;
    }
    if (queryParams.user_state) {
      queryParams.user_state.invitation_token = null;
    }
    const result = await session.run(invitationAcceptedByUser, queryParams);
    if (result && result.records.length > 0) {
      if (invitedUserEmail) {
        const invitedUserResult = await session.run(getUserByEmail, {
          user_email: invitedUserEmail,
        });
        if (invitedUserResult && invitedUserResult.records.length > 0) {
          const invitedUserData = invitedUserResult.records.map((record) => {
            const userResult = {
              user_state: common.getPropertiesFromRecord(record, "userState"),
              user_surf_lang: record.get("user_surf_lang"),
            };
            return userResult;
          });
          const invitedUserDataState = invitedUserData[0];
          const mailContent =
            constants.EMAIL[invitedUserDataState.user_surf_lang.toUpperCase()]
              .INVITATION_ACCEPTED;
          const mailOption = {
            to: invitedUserEmail,
            subject: mailContent.SUBJECT,
            data: {
              salutation: common.getSalutation(
                invitedUserDataState.user_state.user_sex,
                invitedUserDataState.user_surf_lang
              ),
              user_first_name:
                invitedUserDataState.user_state.user_first_name || "",
              user_last_name:
                invitedUserDataState.user_state.user_last_name || "",
              ...mailContent,
              CONT010: mailContent.CONT010.replace(
                "{{new_user_name}}",
                `${userState.user_first_name} ${userState.user_last_name}`
              ),
              link: "/",
            },
          };
          await sendMail(mailOption, "user-added").catch((error) => {
            console.error("Send Mail :", error);
            throw new APIError({
              lang: defaultLanguage,
              message: "INTERNAL_SERVER_ERROR",
            });
          });
        }
      }
      return true;
    }
    throw new APIError({
      lang: defaultLanguage,
      message: "INTERNAL_SERVER_ERROR",
    });
  } catch (error) {
    session.close();
    throw error;
  }
};
