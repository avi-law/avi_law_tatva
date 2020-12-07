/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError, constants } = require("../../../utils");
const sendMail = require("../../../libs/email");
const { defaultLanguage, frontendURL } = require("../../../config/application");
const { getUserByEmail, setPasswordToken } = require("../../../neo4j/query");

// Send resent password email
const sendResetPasswordEmail = (user, token) => {
  const mailOption = {
    to: user.user_email,
    subject: constants.EMAIL.RESET_PASSWORD_SUBJECT,
    data: {
      email: user.user_email,
      token,
      frontendURL,
      resetPasswordURL: `reset-password`,
    },
  };
  return sendMail(mailOption, "reset-password").catch((error) => {
    console.error("Send Mail :", error);
  });
};

module.exports = async (object, params) => {
  const email = params.user_email;
  const session = driver.session();
  let user;
  try {
    const result = await session.run(getUserByEmail, { user_email: email });
    if (result && result.records.length === 0) {
      throw new APIError({
        lang: defaultLanguage,
        message: "INVALID_FORGOT_PASSWORD",
      });
    }
    const singleRecord = result.records[0];
    user = singleRecord.get(0).properties;
    const randomString =
      Math.random().toString(36) + Math.random().toString(36);
    const token = Buffer.from(randomString).toString("base64");
    const currentDate = new Date();
    currentDate.setHours(
      currentDate.getHours() + constants.RESET_PASSWORD_TOKEN_EXPIRY_HOUR
    );
    const resetTokenExpiryDate = currentDate.getTime();
    return session
      .run(setPasswordToken, {
        user_email: email,
        token,
        resetTokenExpiryDate,
      })
      .then((setResult) => {
        if (setResult && setResult.records.length > 0) {
          sendResetPasswordEmail(user, token);
          return true;
        }
        throw new APIError({
          lang: defaultLanguage,
          message: "INVALID_FORGOT_PASSWORD",
        });
      });
  } catch (error) {
    session.close();
    throw error;
  }
};
