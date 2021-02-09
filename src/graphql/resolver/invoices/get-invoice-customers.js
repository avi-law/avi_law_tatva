/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { constants } = require("../../../utils");
const {
  getInvoiceCustomers,
  getInvoiceCustomersCount,
} = require("../../../neo4j/query");

module.exports = async (object, params) => {
  params = JSON.parse(JSON.stringify(params));
  const session = driver.session();
  const offset = params.offset || 0;
  const limit = params.first || 10;
  const defaultOrderBy = "inv.inv_date DESC";
  let queryOrderBy = "";
  let total = 0;
  let condition = "WHERE r1.to IS NULL ";
  const { orderByInvoice, orderBy, filterByString } = params;
  let invoiceCustomer = [];
  try {
    if (orderByInvoice && orderByInvoice.length > 0) {
      orderByInvoice.forEach((orderInvoice) => {
        const field = orderInvoice.slice(0, orderInvoice.lastIndexOf("_"));
        const last = orderInvoice.split("_").pop().toUpperCase();
        if (queryOrderBy === "") {
          queryOrderBy = `inv.${field} ${last}`;
        } else {
          queryOrderBy = `${queryOrderBy}, inv.${field} ${last}`;
        }
      });
    }
    if (orderBy && orderBy.length > 0) {
      orderBy.forEach((orderCustomer) => {
        const field = orderCustomer.slice(0, orderCustomer.lastIndexOf("_"));
        const last = orderCustomer.split("_").pop().toUpperCase();
        if (queryOrderBy === "") {
          queryOrderBy = `cs.${field} ${last}`;
        } else {
          queryOrderBy = `${queryOrderBy}, cs.${field} ${last}`;
        }
      });
    }
    if (filterByString) {
      const value = filterByString.replace(
        constants.SEARCH_EXCLUDE_SPECIAL_CHAR_REGEX,
        ""
      );
      const invIdString = filterByString.split(" ").join("_");
      condition = `${condition} AND ( toLower(cs.cust_name_01) CONTAINS toLower("${value}") OR toLower(inv.inv_id_strg) CONTAINS toLower("${value}") OR toLower(inv.inv_id_strg) CONTAINS toLower("${invIdString}"))`;
    }
    if (queryOrderBy === "") {
      queryOrderBy = defaultOrderBy;
    }
    const countResult = await session.run(getInvoiceCustomersCount(condition));
    if (countResult && countResult.records.length > 0) {
      const singleRecord = countResult.records[0];
      total = singleRecord.get("count");
    }
    // console.log(getInvoiceCustomers(condition, limit, offset, queryOrderBy));
    const result = await session.run(
      getInvoiceCustomers(condition, limit, offset, queryOrderBy)
    );
    session.close();
    if (result && result.records.length > 0) {
      invoiceCustomer = result.records.map((record) => {
        const invoice = record.get("invoice").properties;
        invoice.customer = record.get("customer").properties;
        invoice.customer.has_cust_state = [
          record.get("customerState").properties,
        ];
        // console.log(invoice);
        return invoice;
      });
    }
    return {
      invoiceCustomer,
      total,
    };
  } catch (error) {
    session.close();
    throw error;
  }
};
