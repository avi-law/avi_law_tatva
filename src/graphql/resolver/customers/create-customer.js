/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { createNewCustomerSate } = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
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
      customerState.cust_disc_perc = Math.floor(
        customerState.cust_disc_perc / 100
      );
    }
    if (customerState && customerState.cust_vat_perc > 0) {
      customerState.cust_vat_perc = Math.floor(
        customerState.cust_vat_perc / 100
      );
    }

    const queryParams = {
      cust_id: params.customer_id,
      cust_inv_currency_id: params.data.cust_inv_currency_id,
      country_id: params.data.country_id,
      cust_contact_user: customerState.cust_contact_user,
      cust_alt_inv_country_id: params.data.cust_alt_inv_country_id,
      cust_inv_lang_id: params.data.cust_inv_lang_id,
      customer_state: customerState,
    };
    const result = await session.run(createNewCustomerSate, queryParams);
    if (result && result.records.length > 0) {
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
