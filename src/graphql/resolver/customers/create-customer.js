/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError, common } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  createNewCustomerSate,
  getCustomerInvoiceFromCountryRelationship,
} = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const customerState = params.data.customer_state || null;
  let customerInvoicedFromCountry = null;
  try {
    if (!customerState) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const resultCountry = await session.run(
      getCustomerInvoiceFromCountryRelationship,
      {
        customerId: params.customer_id,
      }
    );
    if (resultCountry && resultCountry.records.length > 0) {
      if (resultCountry && resultCountry.records.length > 0) {
        const country = resultCountry.records.map((record) =>
          record.get("countryId")
        );
        customerInvoicedFromCountry = country[0];
      }
    }

    if (customerState && customerState.cust_disc_perc > 0) {
      customerState.cust_disc_perc = (
        customerState.cust_disc_perc / 100
      ).toFixed(2);
    } else {
      customerState.cust_disc_perc = 0.0;
    }
    if (customerState && customerState.cust_vat_perc > 0) {
      customerState.cust_vat_perc = (customerState.cust_vat_perc / 100).toFixed(
        2
      );
    } else {
      customerState.cust_vat_perc = 0.0;
    }
    const queryParams = {
      cust_id: params.customer_id,
      cust_inv_currency_id: params.data.cust_inv_currency_id,
      country_id: params.data.country_id,
      cust_contact_user: customerState.cust_contact_user,
      cust_alt_inv_country_id: params.data.cust_alt_inv_country_id,
      cust_inv_lang_id: params.data.cust_inv_lang_id,
      cust_to_be_invoiced_from_country_id:
        params.data.cust_to_be_invoiced_from_country_id,
      cust_to_be_invoiced_from_country_id_old: customerInvoicedFromCountry,
      customer_state: common.cleanObject(customerState),
    };
    // console.log(queryParams);
    // return true;
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
