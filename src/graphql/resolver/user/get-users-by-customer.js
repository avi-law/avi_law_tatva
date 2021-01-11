/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { common } = require("../../../utils");
const {
  getUsersByCustomerCountQuery,
  getUsersByCustomerQuery,
} = require("../../../neo4j/query");

/**
 *
 *
 * @param {*} object
 * @param {*} params
 * @returns
 */
module.exports = async (object, params) => {
  params = JSON.parse(JSON.stringify(params));
  const session = driver.session();
  const offset = params.offset || 0;
  const limit = params.first || 10;
  const { customerId } = params;
  let total = 0;
  const defaultOrderBy = "c.user_email ASC";
  let queryOrderBy = "";
  const { filter, orderBy } = params;
  let condition = `WHERE c.cust_id = ${customerId} AND r2.to IS NULL`;
  try {
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
    if (filter && filter.length > 0) {
      filter.forEach((filterByUser) => {
        Object.keys(filterByUser).forEach((key) => {
          if (/^\d+$/.test(filterByUser[key])) {
            condition = `${condition} AND c.${key} = ${filterByUser[key]}`;
          } else {
            condition = `${condition} AND c.${key} = '${filterByUser[key]}'`;
          }
        });
      });
    }
    if (filter) {
      Object.keys(filter).forEach((key) => {
        const { whereCondition, field } = common.getCypherQueryOpt(
          key,
          filter[key],
          "u"
        );
        if (/^\d+$/.test(filter[key])) {
          condition = `${condition} AND u.${field} = ${filter[key]}`;
        } else {
          condition = `${condition} AND ${whereCondition}`;
        }
      });
    }
    if (queryOrderBy === "") {
      queryOrderBy = defaultOrderBy;
    }

    const countResult = await session.run(
      getUsersByCustomerCountQuery(condition)
    );
    if (countResult && countResult.records.length > 0) {
      const singleRecord = countResult.records[0];
      total = singleRecord.get("count");
    }
    const result = await session.run(
      getUsersByCustomerQuery(condition, limit, offset, queryOrderBy)
    );
    if (result && result.records.length > 0) {
      const users = result.records.map((record) => {
        const user = {
          user: common.getPropertiesFromRecord(record, "u"),
          user_state: common.getPropertiesFromRecord(record, "us"),
          customer: common.getPropertiesFromRecord(record, "c"),
        };
        return user;
      });
      return {
        users,
        total,
      };
    }
    session.close();
    return [];
  } catch (error) {
    session.close();
    throw error;
  }
};
