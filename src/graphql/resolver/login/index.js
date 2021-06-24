/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const {
  defaultLanguage,
  hiTechCustomerIds,
} = require("../../../config/application");
const { constants, auth, common, APIError } = require("../../../utils");
const {
  getUserStateInformationQUery,
  loginQuery,
  getCommonUserStateLogginQuery,
  manageLoginCountQuery,
  logICustomerGTCQuery,
  logInvalidEmailQuery,
} = require("../../../neo4j/query");

module.exports = async (object, params) => {
  const session = driver.session();
  let loginStatus = false;
  let loginFailedCode = null;
  let HitechCustomerList = [];
  try {
    const result = await session.run(loginQuery, params);
    const userState = result.records.map((record) => {
      const userResult = {
        ...common.getPropertiesFromRecord(record, "us"),
        user: common.getPropertiesFromRecord(record, "u"),
      };
      return userResult;
    });
    if (userState && userState[0]) {
      if (!auth.comparePassword(userState[0].user_pwd, params.user_pwd)) {
        // Log invalid password query
        common.loggingData(
          getCommonUserStateLogginQuery("log_par_01: $user_email"),
          {
            type: constants.LOG_TYPE_ID.LOGIN_WITH_WRONG_PASSWORD,
            ...params,
          }
        );
        throw new APIError({
          lang: defaultLanguage,
          message: "INCORRECT_LOGIN_DATA",
        });
      }
      if (typeof userState[0].user.is_email_verified === "boolean") {
        throw new APIError({
          type: "info",
          lang: defaultLanguage,
          message: "EMAIL_VERIFICATION_FAILED",
        });
      }
      const userStateInformation = await session
        .run(getUserStateInformationQUery, params)
        .then((userStateresult) => {
          if (userStateresult && userStateresult.records) {
            const singleRecord = userStateresult.records[0];
            return singleRecord.get(0);
          }
          throw new APIError({
            lang: defaultLanguage,
            message: "INCORRECT_LOGIN_DATA",
          });
        });
      const userSurfLang = userStateInformation.user_surf_lang;
      const customerStates = userStateInformation.cust_states;
      if (customerStates && customerStates.length > 0) {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        const userToCustomerValidTo = _.filter(customerStates, (state) => {
          if (!state.user_to) {
            return state;
          }
        });
        if (hiTechCustomerIds && hiTechCustomerIds !== "") {
          let ids = hiTechCustomerIds.split(",");
          ids = ids.map((n) => +n);
          HitechCustomerList = _.filter(customerStates, (state) => {
            if (ids.indexOf(state.cust_id) !== -1) {
              return state;
            }
          });
        }
        if (userToCustomerValidTo.length === 0) {
          common.loggingData(getCommonUserStateLogginQuery(), {
            type: constants.LOG_TYPE_ID.USER_ACCOUNT_EXPIRED,
            ...params,
          });
          throw new APIError({
            lang: userSurfLang,
            message: "USER_ACCOUNT_EXPIRED",
          });
        }

        const validUserToCustomer = _.filter(userToCustomerValidTo, (o) => {
          if (new Date(o.cust_acc_until) >= currentDate) {
            return o;
          }
        });
        if (validUserToCustomer.length === 0) {
          common.loggingData(getCommonUserStateLogginQuery(), {
            type: constants.LOG_TYPE_ID.CUSTOMER_LINKED_ACCOUNT_EXPIRED,
            ...params,
          });

          throw new APIError({
            lang: userSurfLang,
            message: "CUSTOMER_LINKED_ACCOUNT_EXPIRED",
          });
        }

        const validGTCAcceptedCustomer = _.filter(
          validUserToCustomer,
          (customer) => {
            if (customer.cust_gtc_accepted) return customer;
          }
        );
        if (validGTCAcceptedCustomer.length === 0) {
          const userToCustomerAdmin = _.filter(validUserToCustomer, (o) => {
            if (o.user_is_cust_admin || o.single_user) return o;
          });
          if (userToCustomerAdmin.length > 0) {
            loginFailedCode = constants.LOGIN_FAILED_STATUS.GTC_NOT_ACCEPTED;
            return {
              loginStatus,
              loginFailedCode,
              loginMessage: common.getMessage(loginFailedCode, userSurfLang)
                .message,
              user: null,
              lang: userSurfLang,
              token: auth.generateToken({
                login_status: loginStatus,
                login_failed_code: loginFailedCode,
                user_id: userStateInformation.user_id,
                user_email: userStateInformation.user_email,
                user_sex: userStateInformation.user_sex,
                user_first_name: userStateInformation.user_first_name,
                user_last_name: userStateInformation.user_last_name,
                user_surf_lang: userSurfLang,
              }),
            };
          }
          // Log for GTC not accepted user
          common.loggingData(
            getCommonUserStateLogginQuery("log_par_01: $user_email"),
            {
              type: constants.LOG_TYPE_ID.GTC_NOT_ACCEPTED,
              ...params,
            }
          );
          common.loggingData(logICustomerGTCQuery, {
            type: constants.LOG_TYPE_ID.CUSTOMER_GTC_NOT_ACCEPTED,
            ...params,
          });
          throw new APIError({
            lang: userSurfLang,
            message: "GTC_NOT_ACCEPTED",
          });
        }
      }
      if (!userStateInformation.user_gdpr_accepted) {
        loginFailedCode = constants.LOGIN_FAILED_STATUS.GDPR_NOT_ACCEPTED;
        return {
          loginStatus,
          loginFailedCode,
          loginMessage: common.getMessage(loginFailedCode, userSurfLang)
            .message,
          user: null,
          lang: userSurfLang,
          token: auth.generateToken({
            login_status: loginStatus,
            login_failed_code: loginFailedCode,
            user_id: userStateInformation.user_id,
            user_email: userStateInformation.user_email,
            user_sex: userStateInformation.user_sex,
            user_first_name: userStateInformation.user_first_name,
            user_last_name: userStateInformation.user_last_name,
            user_surf_lang: userSurfLang,
          }),
        };
      }
      // Log success login query
      common.loggingData(getCommonUserStateLogginQuery(), {
        type: constants.LOG_TYPE_ID.LOGIN_SUCCESS,
        ...params,
      });
      await session.run(manageLoginCountQuery, { ...params });
      loginStatus = true;
      userStateInformation.user_is_hitech = HitechCustomerList.length > 0;
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
          user_is_hitech: userStateInformation.user_is_hitech,
        }),
      };
    }
    // Log invalid email query
    common.loggingData(logInvalidEmailQuery, {
      type: constants.LOG_TYPE_ID.LOGIN_WITH_WRONG_CREDENTIALS,
      ...params,
    });
    throw new APIError({
      lang: defaultLanguage,
      message: "INCORRECT_LOGIN_DATA",
    });
  } catch (error) {
    session.close();
    throw error;
  } finally {
    session.close();
  }
};
