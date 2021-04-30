/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const sendMail = require("../../../libs/email");
const { defaultLanguage } = require("../../../config/application");
const {
  invite,
  getUserByEmailWithCustomer,
  getCustomerByCustomerId,
} = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  params = JSON.parse(JSON.stringify(params));
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const adminfirstName = user.user_first_name || "";
  const adminLastName = user.user_last_name || "";
  const userEmail = user.user_email;
  const session = driver.session();
  const inputData = params.data || null;
  let firstNameExistUser = "";
  let lastNameExistUser = "";
  let sexExistUser = "";
  let surfLanguageExistUser = "en";
  let userAlreadyExists = false;
  const response = {
    status: true,
    ...common.getMessage("USER_ADDED_SUCCESSFULLY", userSurfLang),
  };
  try {
    if (!inputData) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    if (inputData.new_user_email) {
      const checkEmailresult = await session.run(getUserByEmailWithCustomer, {
        user_email: inputData.new_user_email,
      });
      if (checkEmailresult && checkEmailresult.records.length > 0) {
        const users = checkEmailresult.records.map((record) => {
          const connectToCustomer = {
            user_state: common.getPropertiesFromRecord(record, "us"),
            customer: common.getPropertiesFromRecord(record, "c"),
            user_surf_lang: record.get("user_surf_lang"),
          };
          return connectToCustomer;
        });
        userAlreadyExists = true;
        // if (users && users[0].customer) {
        //   throw new APIError({
        //     type: "info",
        //     lang: userSurfLang,
        //     message: "USER_HAS_ENTITLED_ALREADY",
        //   });
        // }
        firstNameExistUser = users[0].user_state.user_first_name;
        lastNameExistUser = users[0].user_state.user_last_name;
        sexExistUser = users[0].user_state.user_sex;
        surfLanguageExistUser = users[0].user_surf_lang;
      }
    }
    const randomString =
      Math.random().toString(36) + Math.random().toString(36);
    let token = Buffer.from(randomString).toString("base64");
    token = token.replace("==", "");
    token = token.replace("=", "");
    const queryParams = {
      ...inputData,
      user_email: userEmail,
    };
    if (userAlreadyExists) {
      queryParams.new_user_first_name = firstNameExistUser;
      queryParams.new_user_last_name = lastNameExistUser;
      queryParams.new_user_sex = sexExistUser;
      queryParams.invitation_token = null;
    } else {
      queryParams.invitation_token = token;
    }
    const result = await session.run(invite, queryParams);
    if (result && result.records.length > 0) {
      let mailOption = {};
      let invitingCustomerDetails = null;
      let mailContent = null;
      const invitingCustomer = await session.run(getCustomerByCustomerId, {
        customerId: inputData.cust_id,
      });
      if (invitingCustomer && invitingCustomer.records.length > 0) {
        const customers = invitingCustomer.records.map((record) => {
          const invitingCustomerResult = {
            customer: common.getPropertiesFromRecord(record, "c"),
            customer_state: common.getPropertiesFromRecord(record, "cs"),
          };
          return invitingCustomerResult;
        });
        invitingCustomerDetails = customers[0];
      }

      if (userAlreadyExists) {
        mailContent =
          constants.EMAIL[surfLanguageExistUser.toUpperCase()].ADDED_USER;
      } else {
        mailContent = constants.EMAIL[userSurfLang.toUpperCase()].INVITED;
      }
      if (mailContent) {
        mailOption = {
          to: inputData.new_user_email,
          subject: mailContent.SUBJECT,
          data: {
            salutation: common.getSalutation(
              inputData.new_user_sex,
              userSurfLang
            ),
            user_first_name: inputData.new_user_first_name,
            user_last_name: inputData.new_user_last_name,
            ...mailContent,
            CONT010: mailContent.CONT010.replace(
              "{{admin_user_name}}",
              `${adminfirstName} ${adminLastName}`
            ).replace(
              "{{customer_name}}",
              `${invitingCustomerDetails.customer_state.cust_name_01}`
            ),
            link: `invitation/${token}`,
          },
        };
        await sendMail(mailOption, "user-added").catch((error) => {
          console.error("Send Mail :", error);
          throw new APIError({
            lang: userSurfLang,
            message: "INTERNAL_SERVER_ERROR",
          });
        });
        session.close();
        return response;
      }
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
