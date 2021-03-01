/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError, constants, common } = require("../../../utils");
const sendMail = require("../../../libs/email");
const { defaultLanguage } = require("../../../config/application");
const { getUserByEmail, setEmailVerifyToken } = require("../../../neo4j/query");

// Send resent email verification
const sendResetPasswordEmail = (userData, token) => {
  const currentLang = userData.user_surf_lang.toUpperCase();
  const mailContent =
    constants.EMAIL[currentLang.toUpperCase()].RESEND_EMAIL_VERIFICATION_LINK;

  const mailOption = {
    to: userData.user.user_email,
    subject: mailContent.SUBJECT,
    data: {
      salutation: common.getSalutation(
        userData.user_state.user_sex,
        currentLang
      ),
      user_first_name: userData.user_state.user_first_name,
      user_last_name: userData.user_state.user_last_name,
      verificationToken: token,
      link: "user/email-verification/",
      email: userData.user_email,
      ...mailContent,
    },
  };
  return sendMail(mailOption, "resend-email-verify-link").catch((error) => {
    console.error("Send Mail :", error);
  });
};

module.exports = async (object, params) => {
  const email = params.user_email;
  const session = driver.session();
  try {
    const result = await session.run(getUserByEmail, { user_email: email });
    if (result && result.records.length === 0) {
      throw new APIError({
        lang: defaultLanguage,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const userData = result.records.map((record) => {
      const userResult = {
        user: common.getPropertiesFromRecord(record, "u"),
        user_state: common.getPropertiesFromRecord(record, "userState"),
        user_surf_lang: record.get("user_surf_lang"),
      };
      return userResult;
    });

    if (
      userData[0] &&
      typeof userData[0].user.is_email_verified === "undefined"
    ) {
      throw new APIError({
        lang: defaultLanguage,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const randomString =
      Math.random().toString(36) + Math.random().toString(36);
    let token = Buffer.from(randomString).toString("base64");
    token = token.replace("==", "");
    token = token.replace("=", "");
    return session
      .run(setEmailVerifyToken, {
        user_email: email,
        token,
      })
      .then((setResult) => {
        if (setResult && setResult.records.length > 0) {
          sendResetPasswordEmail(
            {
              ...userData[0],
              user_email: email,
              user_surf_lang: userData[0].user_surf_lang || defaultLanguage,
            },
            token
          );
          return true;
        }
        throw new APIError({
          lang: defaultLanguage,
          message: "INTERNAL_SERVER_ERROR",
        });
      });
  } catch (error) {
    session.close();
    throw error;
  }
};
