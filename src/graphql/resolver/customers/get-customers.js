/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { common } = require("../../../utils");
const {
  getCustomersQuery,
  getCustomersCountQuery,
} = require("../../../neo4j/query");

module.exports = async (object, params) => {
  params = JSON.parse(JSON.stringify(params));
  console.log(params);
  const session = driver.session();
  const offset = params.offset || 0;
  const limit = params.first || 10;
  let total = 0;
  const defaultOrderBy = "cou.iso_3166_1_alpha_2 ASC, c.cust_name_01 ASC";
  let queryOrderBy = "";
  const { orderByCountry, orderBy, filterCountry, filterByCustomer } = params;
  let condition = "WHERE c.cust_id IS NOT NULL ";
  if (orderByCountry && orderByCountry.length > 0) {
    orderByCountry.forEach((orderCountry) => {
      const field = orderCountry.slice(0, orderCountry.lastIndexOf("_"));
      const last = orderCountry.split("_").pop().toUpperCase();
      if (queryOrderBy === "") {
        queryOrderBy = `cou.${field} ${last}`;
      } else {
        queryOrderBy = `${queryOrderBy}, cou.${field} ${last}`;
      }
    });
  }
  if (orderBy && orderBy.length > 0) {
    orderBy.forEach((orderCustomer) => {
      const field = orderCustomer.slice(0, orderCustomer.lastIndexOf("_"));
      const last = orderCustomer.split("_").pop().toUpperCase();
      if (queryOrderBy === "") {
        queryOrderBy = `c.${field} ${last}`;
      } else {
        queryOrderBy = `${queryOrderBy}, c.${field} ${last}`;
      }
    });
  }
  if (filterCountry && filterCountry.length > 0) {
    filterCountry.forEach((filterByCountry) => {
      Object.keys(filterByCountry).forEach((key) => {
        if (/^\d+$/.test(filterByCountry[key])) {
          condition = `${condition} AND cou.${key} = ${filterByCountry[key]}`;
        } else {
          condition = `${condition} AND cou.${key} = '${filterByCountry[key]}'`;
        }
      });
    });
  }
  if (filterByCustomer) {
    Object.keys(filterByCustomer).forEach((key) => {
      const { field, opt } = common.getCypherQueryOpt(key);
      if (/^\d+$/.test(filterByCustomer[key])) {
        condition = `${condition} AND c.${field} = ${filterByCustomer[key]}`;
      } else {
        condition = `${condition} AND c.${field} ${opt} '${filterByCustomer[key]}'`;
      }
    });
  }
  if (queryOrderBy === "") {
    queryOrderBy = defaultOrderBy;
  }
  try {
    const countResult = await session.run(getCustomersCountQuery(condition));
    if (countResult && countResult.records.length > 0) {
      const singleRecord = countResult.records[0];
      total = singleRecord.get("count");
    }
    // console.log(getCustomersQuery(condition, limit, offset, queryOrderBy));
    const result = await session.run(
      getCustomersQuery(condition, limit, offset, queryOrderBy)
    );
    // cou.country_name_en = "Austria"
    if (result && result.records.length > 0) {
      const customers = result.records.map((record) => record.get("customers"));
      return {
        customers,
        total,
      };
    }
    return [];
  } catch (error) {
    session.close();
    throw error;
  }
};
