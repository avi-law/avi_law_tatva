/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { common } = require("../../../utils");
const { getUsersCountQuery, getUsersQuery } = require("../../../neo4j/query");

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
  let total = 0;
  const defaultOrderBy = "u.user_email ASC";
  let queryOrderBy = "";
  const {
    filter,
    orderBy,
    filterByString,
    filterByUserState,
    orderByUserState,
  } = params;
  let condition = `WHERE r2.to IS NULL`;
  try {
    if (orderBy && orderBy.length > 0) {
      orderBy.forEach((orderCustomer) => {
        const field = orderCustomer.slice(0, orderCustomer.lastIndexOf("_"));
        const last = orderCustomer.split("_").pop().toUpperCase();
        if (queryOrderBy === "") {
          queryOrderBy = `u.${field} ${last}`;
        } else {
          queryOrderBy = `${queryOrderBy}, u.${field} ${last}`;
        }
      });
    }
    if (orderByUserState && orderByUserState.length > 0) {
      orderByUserState.forEach((orderUserState) => {
        const field = orderUserState.slice(0, orderUserState.lastIndexOf("_"));
        const last = orderUserState.split("_").pop().toUpperCase();
        if (queryOrderBy === "") {
          queryOrderBy = `us.${field} ${last}`;
        } else {
          queryOrderBy = `${queryOrderBy}, us.${field} ${last}`;
        }
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
    if (filterByUserState) {
      Object.keys(filterByUserState).forEach((key) => {
        const { whereCondition, field } = common.getCypherQueryOpt(
          key,
          filterByUserState[key],
          "us"
        );
        if (/^\d+$/.test(filterByUserState[key])) {
          condition = `${condition} AND us.${field} = ${filterByUserState[key]}`;
        } else {
          condition = `${condition} AND ${whereCondition}`;
        }
      });
    }
    if (filterByString) {
      const value = filterByString.replace(/[&/\\#,+()$~%.'":*?^<>{}]/g, "");
      condition = `${condition} AND ( us.user_first_name CONTAINS "${value}" OR us.user_last_name CONTAINS "${value}" OR u.user_email CONTAINS "${value}")`;
    }
    if (queryOrderBy === "") {
      queryOrderBy = defaultOrderBy;
    }
    const countResult = await session.run(getUsersCountQuery(condition));
    if (countResult && countResult.records.length > 0) {
      const singleRecord = countResult.records[0];
      total = singleRecord.get("count");
    }
    console.log(queryOrderBy);
    const result = await session.run(
      getUsersQuery(condition, limit, offset, queryOrderBy)
    );
    if (result && result.records.length > 0) {
      const users = result.records.map((record) => {
        const user = {
          user: common.getPropertiesFromRecord(record, "u"),
          user_state: common.getPropertiesFromRecord(record, "us"),
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
