/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError, constants, common } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { getUserByEmailVerificationToken } = require("../../../neo4j/query");
const sendMail = require("../../../libs/email");

module.exports = async (object, params) => {
  const { token } = params;
  const session = driver.session();
  try {
    if (!token) {
      return false;
    }
    const result = await session.run(getUserByEmailVerificationToken, {
      token,
    });
    if (result && result.records.length > 0) {
      session.close();
      const userData = result.records.map((record) => {
        const userResult = {
          user: common.getPropertiesFromRecord(record, "u"),
          user_state: common.getPropertiesFromRecord(record, "us"),
          lang: common.getPropertiesFromRecord(record, "l1"),
        };
        return userResult;
      });
      if (userData[0]) {
        const mailContent =
          constants.EMAIL[userData[0].lang.iso_639_1.toUpperCase()]
            .EMAIL_VERIFIED;
        const mailOption = {
          to: userData[0].user.user_email,
          subject: mailContent.SUBJECT,
          data: {
            salutation: common.getSalutation(
              userData[0].user_state.user_sex,
              userData[0].lang.iso_639_1
            ),
            user_first_name: userData[0].user_state.user_first_name,
            user_last_name: userData[0].user_state.user_last_name,
            verificationToken: token,
            link: "user/email-verification",
            ...mailContent,
          },
        };
        sendMail(mailOption, "email-verified").catch((error) => {
          console.error("Send Mail :", error);
        });
      }
      return true;
    }
    throw new APIError({
      lang: defaultLanguage,
      message: "INVALID_EMAIL_VERIFICATION_LINK",
    });
  } catch (error) {
    session.close();
    throw error;
  }
};
