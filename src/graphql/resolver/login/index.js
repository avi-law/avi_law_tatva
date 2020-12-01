/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { constants, auth, common } = require("../../../utils");
const {
  getUserStateInformationQUery,
  loginQuery,
  getCommonUserStateLogginQuery,
  manageLoginCountQuery,
  logICustomerGTCQuery,
  logInvalidEmailQuery,
} = require("../../../neo4j/query");

module.exports = async (object, params, ctx, info) => {
  const session = driver.session();
  let loginStatus = false;
  let loginFailedCode = null;
  try {
    const result = await session.run(loginQuery, params);
    const userState = result.records.map(
      (record) => record.get("userState").properties
    );

    if (userState && userState[0]) {
      // if (!auth.comparePassword(userState[0].user_pwd, params.password)) {
      if (userState[0].user_pwd !== params.user_pwd) {
        // Log invalid password query
        await session.run(
          getCommonUserStateLogginQuery("log_par_01: $user_email"),
          {
            type: constants.LOG_TYPE_ID.LOGIN_WITH_WRONG_PASSWORD,
            ...params,
          }
        );
        throw new Error(common.getMessage("INVALID_LOGIN_PASSWORD"));
      }
      const userStateInformation = await session
        .run(getUserStateInformationQUery, params)
        .then((userStateresult) => {
          if (userStateresult && userStateresult.records) {
            const singleRecord = userStateresult.records[0];
            return singleRecord.get(0);
          }
          throw new Error(common.getMessage("INVALID_LOGIN_EMAIL"));
        });
      const userSurfLang = userStateInformation.user_surf_lang;
      const customerStates = userStateInformation.cust_states;
      if (customerStates && customerStates.length > 0) {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        const userToCustomerValidTo = _.filter(customerStates, (state) => {
          if (state.user_to) {
            return state;
          }
        });
        if (userToCustomerValidTo.length === 0) {
          await session.run(getCommonUserStateLogginQuery(), {
            type: constants.LOG_TYPE_ID.USER_ACCOUNT_EXPIRED,
            ...params,
          });
          throw new Error(
            common.getMessage("USER_ACCOUNT_EXPIRED", userSurfLang)
          );
        }

        const validUserToCustomer = _.filter(userToCustomerValidTo, (o) => {
          if (new Date(o.cust_acc_until) >= currentDate) {
            return o;
          }
        });
        if (validUserToCustomer.length === 0) {
          await session.run(getCommonUserStateLogginQuery(), {
            type: constants.LOG_TYPE_ID.CUSTOMER_LINKED_ACCOUNT_EXPIRED,
            ...params,
          });
          throw new Error(
            common.getMessage("CUSTOMER_LINKED_ACCOUNT_EXPIRED", userSurfLang)
          );
        }

        const validGTCAcceptedCustomer = _.filter(
          validUserToCustomer,
          (customer) => {
            if (customer.cust_gtc_accepted) return customer;
          }
        );
        if (validGTCAcceptedCustomer.length === 0) {
          const userToCustomerAdmin = _.filter(validUserToCustomer, (o) => {
            if (o.user_is_cust_admin) return o;
          });
          if (userToCustomerAdmin.length > 0) {
            loginFailedCode = constants.LOGIN_FAILED_STATUS.GTC_NOT_ACCEPTED;
            return {
              loginStatus,
              loginFailedCode,
              loginMessage: common.getMessage(loginFailedCode, userSurfLang),
              user: null,
              lang: userSurfLang,
              token: auth.generateToken({
                login_status: loginStatus,
                login_failed_code: loginFailedCode,
                user_id: userStateInformation.user_id,
                user_email: userStateInformation.user_email,
                user_surf_lang: userSurfLang,
              }),
            };
          }
          // Log for GTC not accepted user
          await session.run(
            getCommonUserStateLogginQuery("log_par_01: $user_email"),
            {
              type: constants.LOG_TYPE_ID.GTC_NOT_ACCEPTED,
              ...params,
            }
          );
          await session.run(logICustomerGTCQuery, {
            type: constants.LOG_TYPE_ID.CUSTOMER_GTC_NOT_ACCEPTED,
            ...params,
          });
          throw new Error(common.getMessage("GTC_NOT_ACCEPTED", userSurfLang));
        }
      }
      if (!userStateInformation.user_gdpr_accepted) {
        loginFailedCode = constants.LOGIN_FAILED_STATUS.GDPR_NOT_ACCEPTED;
        return {
          loginStatus,
          loginFailedCode,
          loginMessage: common.getMessage(loginFailedCode, userSurfLang),
          user: null,
          lang: userSurfLang,
          token: auth.generateToken({
            login_status: loginStatus,
            login_failed_code: loginFailedCode,
            user_id: userStateInformation.user_id,
            user_email: userStateInformation.user_email,
            user_surf_lang: userSurfLang,
          }),
        };
      }
      // Log success login query
      await session.run(getCommonUserStateLogginQuery(), {
        type: constants.LOG_TYPE_ID.LOGIN_SUCCESS,
        ...params,
      });
      await session.run(manageLoginCountQuery, { ...params });
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
    }
    // Log invalid email query
    await session.run(logInvalidEmailQuery, {
      type: constants.LOG_TYPE_ID.LOGIN_WITH_WRONG_CREDENTIALS,
      ...params,
    });
    throw new Error(common.getMessage("INVALID_LOGIN_EMAIL"));
  } catch (error) {
    session.close();
    throw error;
  }
};
