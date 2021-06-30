/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError, constants, common } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { deleteBlog, logDeleteBlog } = require("../../../neo4j/blog-query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userEmail = user.user_email || null;
  const userIsSysAdmin = user.user_is_sys_admin || false;
  params = JSON.parse(JSON.stringify(params));
  const blogId = params.blog_id;
  const session = driver.session();
  try {
    if (!userIsSysAdmin || Number.isNaN(blogId)) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const result = await session.run(deleteBlog, {
      blog_id: Number(blogId),
    });
    if (result && result.records.length > 0) {
      common.loggingData(logDeleteBlog, {
        type: constants.LOG_TYPE_ID.DELETE_BLOG,
        current_user_email: userEmail,
      });
      return true;
    }
    console.error("Error: Blog not found");
    throw new APIError({
      lang: userSurfLang,
      message: "INTERNAL_SERVER_ERROR",
    });
  } catch (error) {
    session.close();
    throw error;
  } finally {
    session.close();
  }
};
