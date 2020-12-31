/* eslint-disable no-restricted-globals */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const { defaultLanguage } = require("../../../config/application");
const driver = require("../../../config/db");
const {
  getPreparedNewInvoiceDetails,
  getInvoiceCountByYearCountryAndCustomerId,
} = require("../../../neo4j/query");
const { APIError } = require("../../../utils");

const preparedCustomerID = (customerId) => {
  const customerIdLength = customerId.toString().length;
  let newCustomerId;
  switch (customerIdLength) {
    case 1:
      newCustomerId = `000${customerId}`;
      break;
    case 2:
      newCustomerId = `00${customerId}`;
      break;
    case 3:
      newCustomerId = `0${customerId}`;
      break;
    default:
      newCustomerId = customerId;
  }
  return newCustomerId;
};

const getUniqueInvoiceId = async (customerId, year, country) => {
  let session;
  let total;
  try {
    session = driver.session();
    const countResult = await session.run(
      getInvoiceCountByYearCountryAndCustomerId,
      {
        customerId,
        year,
        country,
        customerIdString: preparedCustomerID(customerId),
      }
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
    inv_dept: cs.cust_alt_inv_dept || null,
    inv_order_no: cs.cust_alt_inv_order_no || null,
    inv_cost_center: cs.cust_alt_inv_cost_center || null,
    inv_vat_id: cs.cust_alt_inv_vat_id || null,
  };
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
      let newMonth;
      let newDay;
      let newYear;
      if (typeof cs.cust_paid_until === "object") {
        const { day, month, year } = cs.cust_paid_until;
        const date = new Date(`${year}-${month}-${day}`);
        date.setDate(date.getDate() + 1);
        newMonth = date.getMonth() + 1;
        newDay = date.getDate();
        newYear = date.getFullYear();
      } else {
        const date = new Date(cs.cust_paid_until);
        date.setDate(date.getDate() + 1);
        newMonth = date.getMonth() + 1;
        newDay = date.getDate();
        newYear = date.getFullYear();
      }
      object.inv_date_start = {
        year: newYear,
        month: newMonth,
        day: newDay,
      };
      object.inv_date_end = {
        year: newYear,
        month: 12,
        day: 31,
      };
      object.inv_no_of_months = 12 - newMonth + 1;
    }
    object.inv_rate_per_month = !isNaN(cs.cust_rate) ? +cs.cust_rate : 0.0;
    object.inv_disc_perc = !isNaN(cs.cust_disc_perc) ? +cs.cust_disc_perc : 0.0;
    object.inv_vat_perc = !isNaN(cs.cust_vat_perc) ? +cs.cust_vat_perc : 0.0;
    object.inv_amount_net = Number(
      object.inv_no_of_months * object.inv_rate_per_month
    ).toFixed(2);
    object.inv_disc_net = Number(
      object.inv_amount_net * object.inv_disc_perc
    ).toFixed(2);
    object.inv_vat = Number(
      (object.inv_amount_net - object.inv_disc_net) * object.inv_vat_perc
    ).toFixed(2);
    object.inv_amount_total = Number(
      (object.inv_amount_net - object.inv_disc_net) * (object.inv_vat_perc += 1)
    ).toFixed(2);
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
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = d.getFullYear();
  let unique = await getUniqueInvoiceId(
    c.cust_id,
    year,
    cou1.iso_3166_1_alpha_2
  );
  unique = unique.toString().length === 1 ? `0${unique}` : unique;
  const customerID = preparedCustomerID(c.cust_id);
  let invoice = {};
  invoice.inv_id_strg = `${cou1.iso_3166_1_alpha_2}_${year}_${customerID}_${unique}`;
  invoice.inv_date = { day, month, year };
  if (cs && cs.cust_alt_inv_name_01) {
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
  invoice.customerInvoiceDetails = invoiceDetails;
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
