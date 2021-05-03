/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
/* eslint-disable func-names */
const { SchemaDirectiveVisitor } = require("apollo-server-express");
const { DirectiveLocation, GraphQLDirective } = require("graphql");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const { jwtSecret, defaultLanguage } = require("../../config/application");
const driver = require("../../config/db");
const { common, APIError } = require("../../utils");
const { loginQuery } = require("../../neo4j/query");

const authorValidRoutes = [
  "getNewsLetterList",
  "getNewsletter",
  "updateNewsletter",
  "createNewsletter",
  "deleteNewsletter",
  "tweetNewsletter",
  "updateSol",
  "deleteSol",
  "createSol",
  "getSols",
  "getRuleBookTreeStructure",
  "searchRuleBook",
  "getSolList",
  "getSolTagForRuleBookIssue",
  "changeOrder",
  "deleteRuleBookIssue",
  "deleteRuleBookStruct",
  "deleteRuleBook",
  "updateRuleBookIssue",
  "updateRuleBook",
  "updateRuleBookStruct",
  "addRuleBookIssue",
  "addRuleBook",
  "addRuleBookStruct",
  "getRuleElementTreeStructure",
  "updateRuleElement",
  "addRuleElement",
  "deleteRuleElement",
  "getRuleElement",
  "changeRuleElementOrder",
  "getRuleElementState",
  "getRuleElementStateDetails",
];

const verifyAndDecodeToken = ({ context }) => {
  const { req } = context;
  if (
    !req ||
    !req.headers ||
    (!req.headers.authorization && !req.headers.Authorization) ||
    (!req && !req.cookies && !req.cookies.token)
  ) {
    throw new APIError({
      lang: defaultLanguage,
      message: "NO_AUTHORIZATION_TOKEN",
    });
  }
  try {
    if (!req.headers.authorization.startsWith("Bearer ")) {
      throw new APIError({
        lang: defaultLanguage,
        message: "INVALID_AUTHORIZATION_TOKEN",
      });
    }
    const token = req.headers.authorization.split(" ")[1];
    if (token) {
      return jwt.verify(token, jwtSecret, {
        algorithms: ["HS256"],
      });
    }
    throw new APIError({
      lang: defaultLanguage,
      message: "INVALID_AUTHORIZATION_TOKEN",
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new APIError({
        lang: defaultLanguage,
        message: "AUTHORIZATION_TOKEN_EXPIRED",
      });
    } else {
      // You are not authorized for this resource
      throw new APIError({
        lang: defaultLanguage,
        message: "INVALID_AUTHORIZATION_TOKEN",
      });
    }
  }
};

const checkValidRequest = async (ctx, payload) => {
  const userEmail = payload.user_email;
  const userSurfLang = payload.user_surf_lang;
  let valid = true;
  const session = driver.session();
  try {
    const result = await session.run(loginQuery, { user_email: userEmail });
    if (result && result.records.length > 0) {
      const userData = result.records.map((record) => {
        const userResult = {
          user: common.getPropertiesFromRecord(record, "u"),
          user_state: common.getPropertiesFromRecord(record, "us"),
        };
        return userResult;
      });
      const systemAdmin = _.get(userData, "[0]user.user_is_sys_admin", null);
      const isAuthor = _.get(userData, "[0]user.user_is_author", null);
      // Validate encrypt password request
      if (!systemAdmin) {
        valid = false;
      }
      if (
        isAuthor &&
        authorValidRoutes.indexOf(ctx.req.body.operationName) !== -1
      ) {
        valid = true;
      }
      if (!valid) {
        throw new APIError({
          lang: userSurfLang,
          message: "INVALID_AUTHORIZATION_TOKEN",
        });
      }
      return valid;
    }
    throw new APIError({
      lang: userSurfLang,
      message: "INVALID_AUTHORIZATION_TOKEN",
    });
  } catch (error) {
    throw new APIError({
      lang: userSurfLang,
      message: "INVALID_AUTHORIZATION_TOKEN",
    });
  }
};

class IsAdminDirective extends SchemaDirectiveVisitor {
  static getDirectiveDeclaration() {
    return new GraphQLDirective({
      name: "isAdminDirective",
      locations: [DirectiveLocation.FIELD_DEFINITION, DirectiveLocation.OBJECT],
    });
  }

  visitObject(obj) {
    const fields = obj.getFields();

    Object.keys(fields).forEach((fieldName) => {
      const field = fields[fieldName];
      const next = field.resolve;

      field.resolve = async (result, args, context, info) => {
        const decoded = verifyAndDecodeToken({ context }); // will throw error if not valid signed jwt
        await checkValidRequest(context, decoded);
        return next(result, args, { ...context, user: decoded }, info);
      };
    });
  }

  visitFieldDefinition(field) {
    const next = field.resolve;

    field.resolve = async (result, args, context, info) => {
      const decoded = verifyAndDecodeToken({ context });
      await checkValidRequest(context, decoded);
      return next(result, args, { ...context, user: decoded }, info);
    };
  }
}

module.exports = IsAdminDirective;
