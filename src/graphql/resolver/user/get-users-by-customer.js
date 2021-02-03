/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { common, APIError, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  getCustomerUsersCountQuery,
  getCustomerUsersQuery,
  isExistsUserInCustomer,
} = require("../../../neo4j/query");

/**
 *
 *
 * @param {*} object
 * @param {*} params
 * @returns
 */
module.exports = async (object, params, ctx) => {
  params = JSON.parse(JSON.stringify(params));
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userIsSysAdmin = user.user_is_sys_admin || false;
  const userEmail = user.user_email;
  const session = driver.session();
  const offset = params.offset || 0;
  const limit = params.first || 10;
  const { customerId } = params;
  let total = 0;
  const defaultOrderBy = "c.user_email ASC";
  let queryOrderBy = "";
  const { filter, orderBy, filterByString, orderByUserState } = params;
  let condition = `WHERE c.cust_id = ${customerId} AND r2.to IS NULL`;
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
    if (filterByString) {
      const value = filterByString.replace(
        constants.SEARCH_EXCLUDE_SPECIAL_CHAR_REGEX,
        ""
      );
      condition = `${condition} AND ( us.user_first_name CONTAINS "${value}" OR us.user_last_name CONTAINS "${value}" OR u.user_email CONTAINS "${value}")`;
    }
    if (queryOrderBy === "") {
      queryOrderBy = defaultOrderBy;
    }
    const countResult = await session.run(
      getCustomerUsersCountQuery(condition)
    );
    if (countResult && countResult.records.length > 0) {
      const singleRecord = countResult.records[0];
      total = singleRecord.get("count");
    }
    const result = await session.run(
      getCustomerUsersQuery(condition, limit, offset, queryOrderBy)
    );
    if (result && result.records.length > 0) {
      const users = result.records.map((record) => {
        const userResult = {
          user: common.getPropertiesFromRecord(record, "u"),
          user_state: common.getPropertiesFromRecord(record, "us"),
          customer: common.getPropertiesFromRecord(record, "c"),
          user_to_customer: common.getPropertiesFromRecord(record, "r1"),
        };
        return userResult;
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
