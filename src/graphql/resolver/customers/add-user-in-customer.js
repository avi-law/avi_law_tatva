/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { APIError, common } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  getUserByEmailWithCustomer,
  addUserToCustomer,
} = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userIsSysAdmin = user.user_is_sys_admin || false;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const customerID = params.customer_id;
  const userEmail = params.user_email;
  try {
    if (!userIsSysAdmin) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const checkEmailresult = await session.run(getUserByEmailWithCustomer, {
      user_email: userEmail,
    });
    if (checkEmailresult && checkEmailresult.records.length === 0) {
      throw new APIError({
        lang: defaultLanguage,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const users = checkEmailresult.records.map((record) => {
      const connectToCustomer = {
        user_state: common.getPropertiesFromRecord(record, "us"),
        customer: common.getPropertiesFromRecord(record, "c"),
        user_surf_lang: record.get("user_surf_lang"),
      };
      return connectToCustomer;
    });
    if (users && users[0].customer) {
      throw new APIError({
        type: "info",
        lang: userSurfLang,
        message: "USER_HAS_ENTITLED_ALREADY",
      });
    }
    const result = await session.run(addUserToCustomer, {
      cust_id: customerID,
      user_email: userEmail,
    });
    if (result && result.records.length > 0) {
      return true;
    }
  } catch (error) {
    session.close();
    throw error;
  }
};
