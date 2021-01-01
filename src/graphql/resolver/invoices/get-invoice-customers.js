/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
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
  const condition = "WHERE r1.to IS NULL ";
  try {
    const countResult = await session.run(getInvoiceCustomersCount(condition));
    if (countResult && countResult.records.length > 0) {
      const singleRecord = countResult.records[0];
      total = singleRecord.get("count");
    }
    if (queryOrderBy === "") {
      queryOrderBy = defaultOrderBy;
    }
    const result = await session.run(
      getInvoiceCustomers(condition, limit, offset, queryOrderBy)
    );
    session.close();
    if (result && result.records.length > 0) {
      const invoiceCustomer = result.records.map((record) => {
        const invoice = record.get("invoice").properties;
        invoice.customer = record.get("customer").properties;
        invoice.customer.has_cust_state = [
          record.get("customerState").properties,
        ];
        console.log(invoice);
        return invoice;
      });
      return {
        invoiceCustomer,
        total,
      };
    }
  } catch (error) {
    session.close();
    throw error;
  }
};
