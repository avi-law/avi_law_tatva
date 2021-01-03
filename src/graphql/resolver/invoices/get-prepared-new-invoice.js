/* eslint-disable no-restricted-globals */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const { defaultLanguage } = require("../../../config/application");
const driver = require("../../../config/db");
const {
  getPreparedNewInvoiceDetails,
  getInvoiceCountByYearCountryAndCustomerId,
} = require("../../../neo4j/query");
const { APIError, common } = require("../../../utils");

const getUniqueInvoiceId = async (params) => {
  let session;
  let total;
  try {
    session = driver.session();
    const countResult = await session.run(
      getInvoiceCountByYearCountryAndCustomerId,
      params
    );
    session.close();
    if (countResult && countResult.records.length > 0) {
      const singleRecord = countResult.records[0];
      total = singleRecord.get("count");
    }
    total += 1;
    return total;
  } catch (error) {
    console.log(error);
    if (session) {
      session.close();
    }
    return 1;
  }
};

const preparedCustomerAltInvoiceData = (cs, cou3, language) => {
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
    inv_country_id: cou3.country_id || null,
    inv_dept: cs.cust_alt_inv_dept || null,
    inv_order_no: cs.cust_alt_inv_order_no || null,
    inv_cost_center: cs.cust_alt_inv_cost_center || null,
    inv_vat_id: cs.cust_alt_inv_vat_id || null,
    inv_cust_ref: `${cs.cust_name_01}`,
  };
  if (cs.cust_name_02) {
    object.inv_cust_ref = `${object.inv_cust_ref}, ${cs.cust_name_02}`;
  }
  if (cs.cust_name_03) {
    object.inv_cust_ref = `${object.inv_cust_ref}, ${cs.cust_name_03}`;
  }
  return object;
};

const preparedCustomerInvoiceData = (cs, cou2, language) => {
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
    inv_country_id: cou2.country_id || null,
    inv_dept: cs.cust_dept || null,
    inv_order_no: cs.cust_order_no || null,
    inv_cost_center: cs.cust_cost_center || null,
    inv_vat_id: cs.cust_vat_id || null,
    inv_cust_ref: null,
  };
  return object;
};

const preparedAmountFieldData = (cs, curr) => {
  const object = {};
  if (cs) {
    if (cs.cust_paid_until) {
      let date;
      if (typeof cs.cust_paid_until === "object") {
        const { day, month, year } = cs.cust_paid_until;
        date = new Date(`${year}-${month}-${day}`);
        date.setDate(date.getDate() + 1);
      } else {
        date = new Date(cs.cust_paid_until);
        date.setDate(date.getDate() + 1);
      }
      object.inv_date_start = common.getDateObject(date);
      object.inv_date_end = {
        year: object.inv_date_start.year,
        month: 12,
        day: 31,
        formatted: [31, 12, object.inv_date_start.year].join("-"),
      };
      object.inv_no_of_months = 12 - object.inv_date_start.month + 1;
    }
    object.inv_rate_per_month = !isNaN(cs.cust_rate) ? +cs.cust_rate : 0.0;
    object.inv_disc_perc = !isNaN(cs.cust_disc_perc) ? +cs.cust_disc_perc : 0.0;
    object.inv_vat_perc = !isNaN(cs.cust_vat_perc) ? +cs.cust_vat_perc : 0.0;
    object.inv_amount_net = common.toFixedNumber(2)(
      object.inv_no_of_months * object.inv_rate_per_month
    );
    object.inv_disc_net = common.toFixedNumber(2)(
      object.inv_amount_net * object.inv_disc_perc
    );
    object.inv_vat = common.toFixedNumber(2)(
      (object.inv_amount_net - object.inv_disc_net) * object.inv_vat_perc
    );
    object.inv_amount_total = common.toFixedNumber(2)(
      (object.inv_amount_net - object.inv_disc_net) * (object.inv_vat_perc += 1)
    );
  }
  if (curr) {
    object.inv_currency = curr.iso_4217 ? curr.iso_4217 : "EUR";
  }
  return object;
};

const preparedNewInvoiceDetails = async (invoiceDetails) => {
  const { c, cs, curr, lang, cou1, cou2, cou3 } = invoiceDetails;
  const language = lang.iso_639_1 || null;
  const country = cou1.iso_3166_1_alpha_2 || null;
  const d = new Date();
  const year = d.getFullYear();
  let customerID = `000${c.cust_id}`.slice(-4);
  if (c.cust_id.length > 4) {
    customerID = c.cust_id;
  }
  let unique = await getUniqueInvoiceId({
    customerId: c.cust_id,
    year,
    country: cou1.iso_3166_1_alpha_2,
    customerIdString: customerID,
  });
  unique = unique.toString().length === 1 ? `0${unique}` : unique;
  let invoice = {};
  invoice.inv_id_strg = `${cou1.iso_3166_1_alpha_2}_${year}_${customerID}_${unique}`;
  invoice.inv_date = common.getDateObject(d);
  invoice.invoiceGoesToAltRec = cs.inv_goes_to_alt_rec;
  invoice.invoiceSentFrom = country;
  invoice.invoiceLanguage = language;
  invoice.invoiceContent = `INV_${language}_${country}`;
  // console.log("cs.inv_goes_to_alt_rec", cs.inv_goes_to_alt_rec);
  if (cs && cs.inv_goes_to_alt_rec) {
    invoice.documentName = `INV_${language}_${country}_ALT_REC`;
    invoice = {
      ...invoice,
      ...preparedCustomerAltInvoiceData(cs, cou3, language),
      ...preparedAmountFieldData(cs, curr),
    };
  } else {
    invoice.documentName = `INV_${language}_${country}_CUST`;
    invoice = {
      ...invoice,
      ...preparedCustomerInvoiceData(cs, cou2, language),
      ...preparedAmountFieldData(cs, curr),
    };
  }
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
