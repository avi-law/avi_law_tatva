/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  createNewCustomerSate,
  getCustomerInvoiceFromCountryRelationship,
  getCustomer,
  logCustomer,
} = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const systemAdmin = user.user_is_sys_admin || null;
  const userEmail = user.user_email || null;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const customerId = params.customer_id;
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
        customerId,
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
    if (systemAdmin) {
      if (customerState && customerState.cust_disc_perc > 0) {
        customerState.cust_disc_perc = (
          customerState.cust_disc_perc / 100
        ).toFixed(2);
      } else {
        customerState.cust_disc_perc = 0.0;
      }
      if (customerState && customerState.cust_vat_perc > 0) {
        customerState.cust_vat_perc = (
          customerState.cust_vat_perc / 100
        ).toFixed(2);
      } else {
        customerState.cust_vat_perc = 0.0;
      }
      if (customerState && customerState.cust_share_klein > 0) {
        customerState.cust_share_klein = (
          customerState.cust_share_klein / 100
        ).toFixed(2);
      } else {
        customerState.cust_share_klein = 0.0;
      }
    } else {
      const oldCustomerStateResult = await session.run(getCustomer, {
        customerId,
      });
      if (oldCustomerStateResult && oldCustomerStateResult.records) {
        const singleRecord = oldCustomerStateResult.records[0];
        const customerStatedetails = singleRecord.get(0);
        const oldCustomerState = customerStatedetails.customer_state;
        customerState.cust_id = oldCustomerState.cust_id;
        customerState.cust_status = oldCustomerState.cust_status;
        customerState.cust_paid_until = oldCustomerState.cust_paid_until;
        customerState.cust_acc_until = oldCustomerState.cust_acc_until;
        customerState.cust_gtc_accepted = oldCustomerState.cust_gtc_accepted;
      } else {
        console.error("Customer details not found");
        throw new APIError({
          lang: userSurfLang,
          message: "INTERNAL_SERVER_ERROR",
        });
      }
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
    const result = await session.run(createNewCustomerSate, queryParams);
    if (result && result.records.length > 0) {
      common.loggingData(logCustomer, {
        type: constants.LOG_TYPE_ID.UPDATE_CUSTOMER,
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
