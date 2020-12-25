/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { getInvoices, getInvoicesCount } = require("../../../neo4j/query");

module.exports = async (object, params) => {
  params = JSON.parse(JSON.stringify(params));
  const session = driver.session();
  const offset = params.offset || 0;
  const limit = params.first || 10;
  const customerId = params.customer_id;
  let total = 0;
  try {
    const countResult = await session.run(getInvoicesCount, {
      customerId,
    });
    if (countResult && countResult.records.length > 0) {
      const singleRecord = countResult.records[0];
      total = singleRecord.get("count");
    }
    const result = await session.run(getInvoices, {
      customerId,
      offset,
      limit,
    });
    if (result && result.records.length > 0) {
      const invoices = result.records.map(
        (record) => record.get("invoices").properties
      );
      return {
        invoices,
        total,
      };
    }
  } catch (error) {
    session.close();
    throw error;
  }
};
