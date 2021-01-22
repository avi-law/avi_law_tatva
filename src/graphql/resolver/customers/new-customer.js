/* eslint-disable no-param-reassign */

const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { createNewCustomer, logCustomer } = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const systemAdmin = user.user_is_sys_admin || null;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userEmail = user.user_email || null;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const customerState = params.data.customer_state || null;
  try {
    if (!customerState) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    if (customerState && customerState.cust_disc_perc > 0) {
      customerState.cust_disc_perc = (
        customerState.cust_disc_perc / 100
      ).toFixed(2);
    }
    if (customerState && customerState.cust_vat_perc > 0) {
      customerState.cust_vat_perc = (customerState.cust_vat_perc / 100).toFixed(
        2
      );
    }
    const queryParams = {
      cust_inv_currency_id: params.data.cust_inv_currency_id,
      country_id: params.data.country_id,
      cust_contact_user: customerState.cust_contact_user,
      cust_alt_inv_country_id: params.data.cust_alt_inv_country_id || null,
      cust_inv_lang_id: params.data.cust_inv_lang_id,
      cust_to_be_invoiced_from_country_id:
        params.data.cust_to_be_invoiced_from_country_id || null,
      customer_state: common.cleanObject(customerState),
    };
    const result = await session.run(createNewCustomer, queryParams);
    if (result && result.records.length > 0) {
      common.loggingData(logCustomer, {
        type: constants.LOG_TYPE_ID.CREATE_CUSTOMER,
        cust_id: params.customer_id,
        current_user_email: userEmail,
      });
      return true;
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
