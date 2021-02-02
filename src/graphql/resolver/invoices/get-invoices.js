/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  getInvoicesCount,
  isExistsUserInCustomer,
} = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userIsSysAdmin = user.user_is_sys_admin || false;
  const userEmail = user.user_email;
  params = JSON.parse(JSON.stringify(params));
  const session = driver.session();
  const offset = params.offset || 0;
  const limit = params.first || 10;
  const customerId = params.customer_id;
  const defaultOrderBy = "inv.inv_date DESC";
  let queryOrderBy = "";
  let total = 0;
  const { orderByInvoice } = params;
  try {
    /** Check is valid customer profile fetch */
    if (!userIsSysAdmin) {
      await session
        .run(isExistsUserInCustomer, {
          user_email: userEmail,
          cust_id: customerId,
        })
        .then((result) => {
          if (result && result.records.length > 0) {
            const singleRecord = result.records[0];
            if (!singleRecord.get("count")) {
              throw new APIError({
                lang: userSurfLang,
                message: "INTERNAL_SERVER_ERROR",
              });
            }
            return true;
          }
          throw new APIError({
            lang: userSurfLang,
            message: "INTERNAL_SERVER_ERROR",
          });
        })
        .catch((error) => {
          session.close();
          throw error;
        });
    }
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
    if (queryOrderBy === "") {
      queryOrderBy = defaultOrderBy;
    }
    const countResult = await session.run(getInvoicesCount, {
      customerId,
    });
    if (countResult && countResult.records.length > 0) {
      const singleRecord = countResult.records[0];
      total = singleRecord.get("count");
    }
    const query = `MATCH (c:Customer)<-[:INV_FOR_CUST]-(inv:Invoice)
    WHERE c.cust_id = ${customerId}
    RETURN inv as invoices
    ORDER BY ${queryOrderBy}
    SKIP toInteger(${offset})
    LIMIT toInteger(${limit})`;
    const result = await session.run(query);
    session.close();
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
