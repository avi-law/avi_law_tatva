/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError, common, auth, constants } = require("../../../utils");
const {
  defaultLanguage,
  carbonCopyEmail,
} = require("../../../config/application");
const { register, getUserByEmail } = require("../../../neo4j/query");
const sendMail = require("../../../libs/email");

module.exports = async (object, params) => {
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const userState = params.data.user_state || null;
  const customerState = params.data.customer_state || null;
  const userDetails = params.data.user || null;
  let isCustomerAdmin = null;
  const plan = params.data.subscriptionPlan
    ? constants.SUBSCRIPTION_PLAN[params.data.subscriptionPlan]
    : null;
  try {
    if (!userState || !customerState || !userDetails.user_email || !plan) {
      throw new APIError({
        lang: defaultLanguage,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    await session
      .run(getUserByEmail, {
        user_email: userDetails.user_email,
      })
      .then((checkEmailresult) => {
        if (checkEmailresult && checkEmailresult.records.length > 0) {
          return false;
          // throw new APIError({
          //   lang: defaultLanguage,
          //   message: "EMAIL_ALREADY_EXISTS",
          // });
        }
        return true;
      })
      .catch((error) => {
        session.close();
        throw error;
      });
    if (!plan.cust_single) {
      isCustomerAdmin = true;
    }
    const randomString =
      Math.random().toString(36) + Math.random().toString(36);
    let token = Buffer.from(randomString).toString("base64");
    token = token.replace("==", "");
    token = token.replace("=", "");
    const pwd = userState.user_pwd;
    const encryptedPassword = await auth.hashPassword(pwd);
    userState.user_pwd = encryptedPassword;
    let invoiceToBeCountry = "AT";
    const queryParams = {
      verificationToken: token,
      user_email: userDetails.user_email,
      user: userDetails,
      user_state: common.cleanObject(userState),
      customer_state: common.cleanObject(customerState),
      user_is_sys_admin: null,
      user_is_author: null,
      is_cust_admin: isCustomerAdmin,
      user_pref_1st_lang_iso_639_1: params.data.cust_inv_lang_iso_639_1.toLowerCase(),
      user_pref_country_iso_3166_1_alpha_2:
        params.data.cust_country_iso_3166_1_alpha_2,
      cust_alt_inv_country_iso_3166_1_alpha_2:
        params.data.cust_alt_inv_country_iso_3166_1_alpha_2,
      cust_inv_currency_iso_4217: params.data.cust_inv_currency_iso_4217,
      user_want_nl_from_country_iso_3166_1_alpha_2: [
        params.data.cust_country_iso_3166_1_alpha_2,
      ],
    };
    if (params.data.cust_inv_lang_iso_639_1.toUpperCase() === "DE") {
      queryParams.user_pref_2nd_lang_iso_639_1 = "en";
    } else {
      queryParams.user_pref_2nd_lang_iso_639_1 = "de";
    }
    const currentDate = new Date();
    currentDate.setMonth(
      currentDate.getMonth() + constants.FREE_SUBSCRIPTION_IN_MONTH
    );
    const date = new Date();
    const y = date.getFullYear();
    const m = date.getMonth();
    const lastDay = new Date(y, m + 1, 0);
    queryParams.customer_state = {
      ...queryParams.customer_state,
      ...plan,
      cust_contact_user: userDetails.user_email,
      cust_status: 1,
      cust_gtc_accepted: +Date.now(),
      cust_acc_until: common.getNeo4jDateType(currentDate),
      cust_paid_until: common.getNeo4jDateType(lastDay),
      cust_no_invoice: false,
      cust_share_klein: 0.0,
    };
    queryParams.user_state.user_login_count = 0;
    queryParams.user_state.user_last_login = null;
    if (
      params.data.cust_country_iso_3166_1_alpha_2 === "DE" ||
      (customerState.inv_goes_to_alt_rec &&
        params.data.cust_alt_inv_country_iso_3166_1_alpha_2 === "DE")
    ) {
      invoiceToBeCountry = "DE";
      queryParams.customer_state.cust_vat_perc = constants.CUSTOMER_VAT_PER_DE;
    } else {
      queryParams.customer_state.cust_vat_perc = constants.CUSTOMER_VAT_PER;
    }
    queryParams.to_be_invoiced_from_country = invoiceToBeCountry;
    queryParams.user_want_nl_from_country_iso_3166_1_alpha_2.push("EU");

    queryParams.user_state = common.cleanObject(queryParams.user_state);
    queryParams.customer_state = common.cleanObject(queryParams.customer_state);
    const result = await session.run(register(queryParams));
    if (result && result.records.length > 0) {
      const mailContent =
        constants.EMAIL[params.data.cust_inv_lang_iso_639_1.toUpperCase()]
          .REGISTRATION_VERIFICATION;
      const mailOption = {
        to: userDetails.user_email,
        bcc: carbonCopyEmail,
        subject: mailContent.SUBJECT,
        data: {
          salutation: common.getSalutation(
            userState.user_sex,
            params.data.cust_inv_lang_iso_639_1
          ),
          user_first_name: userState.user_first_name,
          user_last_name: userState.user_last_name,
          verificationToken: token,
          link: "user/email-verification/",
          ...mailContent,
        },
      };
      await sendMail(mailOption, "registration-comfirmation").catch((error) => {
        console.error("Send Mail :", error);
      });
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
