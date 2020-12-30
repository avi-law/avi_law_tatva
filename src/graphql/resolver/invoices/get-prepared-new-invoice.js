/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const moment = require("moment");
const { defaultLanguage } = require("../../../config/application");
const driver = require("../../../config/db");
const { getPreparedNewInvoiceDetails } = require("../../../neo4j/query");
const { APIError, common } = require("../../../utils");

const setCustomerAltInvoiceData = (cs, cou3, language) => {
  const object = {
    inv_name_01: cs.cust_alt_inv_name_01 || null,
    inv_name_02: cs.cust_alt_inv_name_02 || null,
    inv_name_03: cs.cust_alt_inv_name_03 || null,
    inv_cust_salut: cs.cust_alt_inv_salut || null,
    inv_email: cs.cust_alt_inv_email || null,
    inv_street_no: cs.cust_alt_inv_street_no || null,
    inv_zip: cs.cust_alt_inv_zip || null,
    inv_city: cs.cust_alt_inv_city || null,
    inv_country: cou3[`country_name_${language}`] || null,
    inv_dept: cs.cust_alt_inv_dept || null,
    inv_order_no: cs.cust_alt_inv_order_no || null,
    inv_cost_center: cs.cust_alt_inv_cost_center || null,
    inv_vat_id: cs.cust_alt_inv_vat_id || null,
  };
  return object;
};

const setCustomerInvoiceData = (cs, cou2, language) => {
  const object = {
    inv_name_01: cs.cust_name_01 || null,
    inv_name_02: cs.cust_name_02 || null,
    inv_name_03: cs.cust_name_03 || null,
    inv_cust_salut: cs.cust_contact_user_salut || null,
    inv_email: cs.cust_contact_user || null,
    inv_street_no: cs.cust_street_no || null,
    inv_zip: cs.cust_zip || null,
    inv_city: cs.cust_city || null,
    inv_country: cou2[`country_name_${language}`] || null,
    inv_dept: cs.cust_dept || null,
    inv_order_no: cs.cust_order_no || null,
    inv_cost_center: cs.cust_cost_center || null,
    inv_vat_id: cs.cust_vat_id || null,
  };
  return object;
};

const preparedAmountFieldData = (cs, curr) => {
  const object = {};
  if (cs) {
    if (cs.cust_paid_until) {
      const { day, month, year } = cs.cust_paid_until;
      const date = new Date(`${year}-${month}-${day}`);
      date.setDate(date.getDate() + 1);
      const newMonth = date.getMonth() + 1;
      const newDay = date.getDate();
      const newYear = date.getFullYear();
      object.inv_date_start = {
        year: newYear,
        month: newMonth,
        day: newDay,
      };
      object.inv_date_start = {
        year: newYear,
        month: 12,
        day: 31,
      };
      object.inv_no_of_months = 12 - newMonth + 1;
    }
    object.inv_rate_per_month = cs.cust_rate ? cs.cust_rate : 0.0;
    object.inv_disc_perc = cs.cust_disc_perc ? cs.cust_disc_perc : 0.0;
    object.inv_vat_perc = cs.cust_vat_perc ? cs.cust_vat_perc : 0.0;
    object.inv_amount_net = object.inv_no_of_months * object.inv_rate_per_month;
    object.inv_disc_net = object.inv_amount_net * object.inv_disc_perc;
    object.inv_vat =
      (object.inv_amount_net - object.inv_disc_net) * object.inv_vat_perc;
    object.inv_amount_total =
      (object.inv_amount_net - object.inv_disc_net) * (object.inv_vat_perc + 1);
  }
  if (curr) {
    object.inv_currency = curr.iso_4217 ? curr.iso_4217 : "EUR";
  }
  return object;
};

const preparedNewInvoiceDetails = (invoiceDetails) => {
  const { c, cs, curr, lang, cou1, cou2, cou3 } = invoiceDetails;
  const language = lang.iso_639_1 || null;
  const country = cou1.iso_3166_1_alpha_2 || null;
  const d = new Date();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = d.getFullYear();
  const unique = "01";
  let invoice = {};
  invoice.inv_id_strg = `${cou1.iso_3166_1_alpha_2}_${year}_${c.cust_id}_${unique}`;
  invoice.inv_date = { day, month, year };
  let documentName;
  if (cs && cs.cust_alt_inv_name_01) {
    documentName = `INV_${language}_${country}_ALT_REC`;
    invoice = {
      ...invoice,
      ...setCustomerAltInvoiceData(cs, cou3, language),
      ...preparedAmountFieldData(cs, curr),
    };
  } else {
    documentName = `INV_${language}_${country}_CUST`;
    invoice = {
      ...invoice,
      ...setCustomerInvoiceData(cs, cou2, language),
      ...preparedAmountFieldData(cs, curr),
    };
  }
  // console.log("invoice", invoice);
  console.log("documentName", documentName);
  return invoice;
};

module.exports = async (object, params, ctx) => {
  params = JSON.parse(JSON.stringify(params));
  const systemAdmin = ctx.user.user_is_sys_admin;
  const userSurfLang = ctx.user.user_surf_lang || defaultLanguage;
  const customerId = params.customer_id;
  let session;
  try {
    if (!systemAdmin && !customerId) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    session = driver.session();
    const result = await session.run(getPreparedNewInvoiceDetails, {
      customerId,
    });
    session.close();
    if (result && result.records.length > 0) {
      const invoiceDetails = result.records.map((record) => {
        const invoiceObject = {
          c: record.get("c").properties,
          cs: record.get("cs").properties,
          curr: record.get("curr").properties,
          lang: record.get("lang").properties,
          cou1: record.get("cou1").properties,
          cou2: record.get("cou2").properties,
          cou3: record.get("cou3").properties,
        };
        return invoiceObject;
      });
      return preparedNewInvoiceDetails(invoiceDetails[0]);
    }
    throw new APIError({
      lang: userSurfLang,
      message: "INTERNAL_SERVER_ERROR",
    });
  } catch (error) {
    if (session) {
      session.close();
    }
    throw error;
  }
};
