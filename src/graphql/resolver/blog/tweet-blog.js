/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError, common } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { getBlog, tweetBlog } = require("../../../neo4j/blog-query");

const getBlogDetails = async (blogID) => {
  const session = driver.session();
  try {
    const result = await session.run(getBlog, { blog_id: blogID });
    if (result && result.records.length > 0) {
      const blogs = result.records.map((record) => {
        const bls = {
          de: {
            blog_text: null,
            blog_title_long: null,
            blog_title_short: null,
          },
          en: {
            blog_text: null,
            blog_title_long: null,
            blog_title_short: null,
          },
        };
        if (record.get("bls") && record.get("bls").length > 0) {
          record.get("bls").forEach((blState) => {
            if (
              blState.lang &&
              blState.bls &&
              blState.lang.properties.iso_639_1
            ) {
              bls[blState.lang.properties.iso_639_1] = blState.bls.properties;
            }
          });
        }
        const blogResult = {
          bl: common.getPropertiesFromRecord(record, "nl"),
          bls,
          user: common.getPropertiesFromRecord(record, "u"),
        };
        return blogResult;
      });
      session.close();
      return blogs[0];
    }
  } catch (error) {
    session.close();
    return null;
  }
};

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const systemAdmin = user.user_is_sys_admin || null;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const blogID = params.blog_id;
  try {
    if (!systemAdmin) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const blog = await getBlogDetails(blogID);
    if (blog) {
      if (blog.bl.blog_tweeted) {
        throw new APIError({
          lang: userSurfLang,
          message: "INTERNAL_SERVER_ERROR",
        });
      }
      const result = await session.run(tweetBlog, { blog_id: blogID });
      if (result && result.records.length > 0) {
        session.close();
        return true;
      }
      throw new APIError({
        lang: defaultLanguage,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    return false;
  } catch (error) {
    session.close();
    throw error;
  }
};
