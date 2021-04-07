/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { common, constants } = require("../../../utils");
const {
  getBlogYearList,
  getBlogListByYear,
  getBlogDetails,
  getBlogLog,
  logBlog,
} = require("../../../neo4j/blog-query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  let userEmail = null;
  if (user) {
    userEmail = user.user_email;
  }
  const { lang, year } = params;
  const blogId = params.blog_id || null;
  let currentYear = year;
  const response = {
    years: [],
    blog_list: [],
    blog_first: null,
    total: 0,
  };

  const session = driver.session();
  try {
    const result = await session.run(getBlogYearList({}));
    if (result && result.records.length > 0) {
      const blogYears = result.records.map((record) => record.get("year"));
      response.years = blogYears;
    }
    if (!currentYear && response.years.length > 0) {
      // eslint-disable-next-line prefer-destructuring
      currentYear = response.years[0];
    }
    const blogResult = await session.run(
      getBlogListByYear({
        currentYear,
        userEmail,
      })
    );
    if (blogResult && blogResult.records.length > 0) {
      const blogs = blogResult.records.map((record) => {
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
        const blogResultArray = {
          bl: common.getPropertiesFromRecord(record, "bl"),
          bls,
          user: common.getPropertiesFromRecord(record, "user"),
        };
        return blogResultArray;
      });
      response.blog_list = blogs;
      response.total = blogs.length;
      // eslint-disable-next-line prefer-destructuring
      response.blog_first = blogs[0];
    }
    if (blogId && userEmail) {
      const blogResultDetails = await session.run(getBlogDetails, {
        blog_id: blogId,
        user_email: userEmail,
      });
      if (blogResultDetails && blogResultDetails.records.length > 0) {
        const blogResultDetailsArray = blogResultDetails.records.map(
          (record) => {
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
              createdLog: record.get("createdLog"),
              updatedLog: record.get("updatedLog"),
            };
          }
        );
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
        // eslint-disable-next-line prefer-destructuring
        response.blog_first = blogResultDetailsArray[0];
      }
    } else {
      const blogResultLogDetails = await session.run(getBlogLog, {
        blog_id: response.blog_first.bl.blog_id,
      });
      if (blogResultLogDetails && blogResultLogDetails.records.length > 0) {
        let createdLog = [];
        let updatedLog = [];
        blogResultLogDetails.records.map((record) => {
          createdLog = record.get("createdLog");
          updatedLog = record.get("updatedLog");
          return true;
        });
        if (createdLog && createdLog.length > 0) {
          createdLog = _.orderBy(createdLog, ["timestamp"], ["desc"]);
        }
        if (updatedLog && updatedLog.length > 0) {
          updatedLog = _.orderBy(updatedLog, ["timestamp"], ["desc"]);
        }
        response.blog_first.createdLog = createdLog;
        response.blog_first.updatedLog = updatedLog;
      }
    }

    if (response.blog_list.length === 0) {
      response.blog_first = null;
    }
    if (response.blog_first) {
      if (userEmail) {
        common.loggingData(logBlog, {
          type: constants.LOG_TYPE_ID.READ_BLOG,
          current_user_email: userEmail,
          blog_id: response.blog_first.bl.blog_id || null,
        });
      }
    }
    return response;
  } catch (error) {
    session.close();
    throw error;
  }
};
