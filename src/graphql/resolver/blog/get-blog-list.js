/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { getBlogListCount, getBlogList } = require("../../../neo4j/blog-query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userIsSysAdmin = user.user_is_sys_admin || false;
  params = JSON.parse(JSON.stringify(params));
  const session = driver.session();
  const offset = params.offset || 0;
  const limit = params.first || 10;
  const defaultOrderBy = "bl.blog_date DESC";
  let queryOrderBy = "";
  let total = 0;
  const { orderBy, filterByString, lang } = params;
  let condition = `WHERE lang.iso_639_1 = "${lang}" `;
  try {
    if (!userIsSysAdmin) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    if (orderBy && orderBy.length > 0) {
      orderBy.forEach((blog) => {
        const field = blog.slice(0, blog.lastIndexOf("_"));
        const last = blog.split("_").pop().toUpperCase();
        if (queryOrderBy === "") {
          queryOrderBy = `bl.${field} ${last}`;
        } else {
          queryOrderBy = `${queryOrderBy}, bl.${field} ${last}`;
        }
      });
    }
    if (queryOrderBy === "") {
      queryOrderBy = defaultOrderBy;
    }

    if (filterByString) {
      const value = filterByString.replace(
        constants.SEARCH_EXCLUDE_SPECIAL_CHAR_REGEX,
        ""
      );
      condition = `${condition} AND ( toLower(bls.blog_title_long) CONTAINS toLower("${value}") OR toLower(bl.blog_no) CONTAINS toLower("${value}"))`;
    }
    const countResult = await session.run(getBlogListCount(condition));
    if (countResult && countResult.records.length > 0) {
      const singleRecord = countResult.records[0];
      total = singleRecord.get("count");
    }
    const result = await session.run(
      getBlogList(condition, limit, offset, queryOrderBy)
    );
    if (result && result.records.length > 0) {
      const bls = result.records.map((record) => {
        const blogResult = {
          ...common.getPropertiesFromRecord(record, "bl"),
          blog_state: {
            ...common.getPropertiesFromRecord(record, "bls"),
            blog_language: common.getPropertiesFromRecord(record, "lang"),
          },
        };
        return blogResult;
      });
      return {
        bls,
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
