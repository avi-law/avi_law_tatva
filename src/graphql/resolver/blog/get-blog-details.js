/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { common, constants } = require("../../../utils");
const { getBlogDetails, logBlog } = require("../../../neo4j/blog-query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  let userEmail = null;
  if (user) {
    userEmail = user.user_email;
  }
  const blogId = params.blog_id;
  const session = driver.session();
  try {
    const blogResultDetails = await session.run(getBlogDetails, {
      blog_id: blogId,
      user_email: userEmail,
    });
    if (blogResultDetails && blogResultDetails.records.length > 0) {
      const blogResultDetailsArray = blogResultDetails.records.map((record) => {
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
              const { properties } = blState.bls;
              if (properties && !properties.blog_title_long) {
                properties.blog_title_long =
                  constants.BLOG_TITLE_NOT_AVAILABLE[
                    blState.lang.properties.iso_639_1
                  ];
              }
              bls[blState.lang.properties.iso_639_1] = properties;
            }
          });
        }
        return {
          bl: common.getPropertiesFromRecord(record, "bl"),
          bls,
          blog_author: common.getPropertiesFromRecord(record, "u"),
          user: common.getPropertiesFromRecord(record, "user"),
          createdLog: record.get("createdLog"),
          updatedLog: record.get("updatedLog"),
        };
      });
      // eslint-disable-next-line prefer-destructuring
      if (blogResultDetailsArray[0] && blogResultDetailsArray[0].createdLog) {
        blogResultDetailsArray[0].createdLog = _.orderBy(
          blogResultDetailsArray[0].createdLog,
          ["timestamp"],
          ["desc"]
        );
      }
      if (blogResultDetailsArray[0] && blogResultDetailsArray[0].updatedLog) {
        blogResultDetailsArray[0].updatedLog = _.orderBy(
          blogResultDetailsArray[0].updatedLog,
          ["timestamp"],
          ["desc"]
        );
      }

      if (blogResultDetailsArray[0]) {
        if (userEmail) {
          common.loggingData(logBlog, {
            type: constants.LOG_TYPE_ID.READ_BLOG,
            current_user_email: userEmail,
            blog_id: blogResultDetailsArray[0].bl.blog_id || null,
          });
        }
      }
      return blogResultDetailsArray[0];
    }
    return null;
  } catch (error) {
    session.close();
    throw error;
  } finally {
    session.close();
  }
};
