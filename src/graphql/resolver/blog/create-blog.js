/* eslint-disable no-param-reassign */

const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { blogQuery, logBlog } = require("../../../neo4j/blog-query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const systemAdmin = user.user_is_sys_admin || null;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userEmail = user.user_email || null;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const { data } = params;
  let isValidDE = false;
  let isValidEN = false;
  try {
    if (!systemAdmin) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    if (data.bls) {
      if (data.bls.de) {
        data.bls.de = common.cleanObject(data.bls.de);
      }
      if (data.bls.de) {
        data.bls.en = common.cleanObject(data.bls.en);
      }
    }

    if (
      data.bls &&
      data.bls.de.blog_text &&
      data.bls.de.blog_title_long &&
      data.bls.de.blog_title_short
    ) {
      isValidDE = true;
    }
    if (
      data.bls &&
      data.bls.en.blog_text &&
      data.bls.en.blog_title_long &&
      data.bls.en.blog_title_short
    ) {
      isValidEN = true;
    }
    if (!data.bl.blog_active) {
      data.bl.blog_active = false;
    }
    const queryParams = {
      isUpdate: false,
      user_email: userEmail,
      bl: data.bl,
      bls: data.bls,
      isValidDE,
      isValidEN,
    };
    const result = await session.run(blogQuery(queryParams), {
      queryParams,
    });
    if (result && result.records.length > 0) {
      const blogs = result.records.map((record) => {
        const blResult = {
          ...common.getPropertiesFromRecord(record, "bl"),
        };
        return blResult;
      });
      common.loggingData(logBlog, {
        type: constants.LOG_TYPE_ID.CREATE_BLOG,
        current_user_email: userEmail,
        blog_id: blogs[0].blog_id || null,
      });
      return true;
    }
    throw new APIError({
      lang: userSurfLang,
      message: "INTERNAL_SERVER_ERROR",
    });
  } catch (error) {
    session.close();
    throw error;
  }
};
