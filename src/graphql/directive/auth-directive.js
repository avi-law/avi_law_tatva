/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
/* eslint-disable func-names */
const {
  SchemaDirectiveVisitor,
  AuthenticationError,
} = require("apollo-server-express");
const { DirectiveLocation, GraphQLDirective } = require("graphql");
const jwt = require("jsonwebtoken");
const { jwtSecret, websiteOwnerEmail } = require("../../config/application");
const { common, constants } = require("../../utils");

const verifyAndDecodeToken = ({ context }) => {
  const { req } = context;
  if (
    !req ||
    !req.headers ||
    (!req.headers.authorization && !req.headers.Authorization) ||
    (!req && !req.cookies && !req.cookies.token)
  ) {
    throw new AuthenticationError(common.getMessage("NO_AUTHORIZATION_TOKEN"));
  }
  try {
    if (!req.headers.authorization.startsWith("Bearer ")) {
      throw new AuthenticationError(
        common.getMessage("INVALID_AUTHORIZATION_TOKEN")
      );
    }
    const token = req.headers.authorization.split(" ")[1];
    if (token) {
      return jwt.verify(token, jwtSecret, {
        algorithms: ["HS256"],
      });
    }
    throw new AuthenticationError(
      common.getMessage("INVALID_AUTHORIZATION_TOKEN")
    );
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new AuthenticationError(
        common.getMessage("AUTHORIZATION_TOKEN_EXPIRED")
      );
    } else {
      // You are not authorized for this resource
      throw new AuthenticationError(
        common.getMessage("INVALID_AUTHORIZATION_TOKEN")
      );
    }
  }
};

const checkValidRequest = (ctx, payload) => {
  const { req } = ctx;
  const loginFailedCode = payload.login_failed_code;
  const { operationName } = req.body;
  const userSurfLang = payload.user_surf_lang;
  const userEmail = payload.user_email;
  let valid = true;
  if (
    ["acceptGTC", "acceptGDPR"].indexOf(operationName) !== -1 &&
    !payload.login_status
  ) {
    valid = false;
  }
  // Validate GTC and GDPR accept endpoint with temp token
  if (
    (operationName === "acceptGTC" &&
      constants.LOGIN_FAILED_STATUS.GTC_NOT_ACCEPTED !== loginFailedCode) ||
    (operationName === "acceptGDPR" &&
      constants.LOGIN_FAILED_STATUS.GDPR_NOT_ACCEPTED === loginFailedCode)
  ) {
    valid = false;
  }
  // Validate encrypt password request
  if (operationName === "encryptPassword" && userEmail !== websiteOwnerEmail) {
    valid = false;
  }
  if (!valid) {
    throw new AuthenticationError(
      common.getMessage("INVALID_AUTHORIZATION_TOKEN", userSurfLang)
    );
  }
  return valid;
};

class IsAuthenticatedDirective extends SchemaDirectiveVisitor {
  static getDirectiveDeclaration() {
    return new GraphQLDirective({
      name: "isAuthenticated",
      locations: [DirectiveLocation.FIELD_DEFINITION, DirectiveLocation.OBJECT],
    });
  }

  visitObject(obj) {
    const fields = obj.getFields();

    Object.keys(fields).forEach((fieldName) => {
      const field = fields[fieldName];
      const next = field.resolve;

      field.resolve = function (result, args, context, info) {
        const decoded = verifyAndDecodeToken({ context }); // will throw error if not valid signed jwt
        checkValidRequest(context, decoded);
        return next(result, args, { ...context, user: decoded }, info);
      };
    });
  }

  visitFieldDefinition(field) {
    const next = field.resolve;

    field.resolve = function (result, args, context, info) {
      const decoded = verifyAndDecodeToken({ context });
      checkValidRequest(context, decoded);
      return next(result, args, { ...context, user: decoded }, info);
    };
  }
}

module.exports = IsAuthenticatedDirective;
