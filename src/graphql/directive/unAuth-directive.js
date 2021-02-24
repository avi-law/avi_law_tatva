/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
/* eslint-disable func-names */
const { SchemaDirectiveVisitor } = require("apollo-server-express");
const { DirectiveLocation, GraphQLDirective } = require("graphql");
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../../config/application");

const verifyAndDecodeToken = ({ context }) => {
  const { req } = context;
  if (
    !req ||
    !req.headers ||
    (!req.headers.authorization && !req.headers.Authorization) ||
    (!req && !req.cookies && !req.cookies.token)
  ) {
    return null;
  }
  try {
    if (!req.headers.authorization.startsWith("Bearer ")) {
      return null;
    }
    const token = req.headers.authorization.split(" ")[1];
    if (token) {
      return jwt.verify(token, jwtSecret, {
        algorithms: ["HS256"],
      });
    }
    return null;
  } catch (err) {
    return null;
  }
};

class IsUnAuthenticatedDirective extends SchemaDirectiveVisitor {
  static getDirectiveDeclaration() {
    return new GraphQLDirective({
      name: "isUnAuthenticated",
      locations: [DirectiveLocation.FIELD_DEFINITION],
    });
  }

  visitObject(obj) {
    const fields = obj.getFields();

    Object.keys(fields).forEach((fieldName) => {
      const field = fields[fieldName];
      const next = field.resolve;

      field.resolve = function (result, args, context, info) {
        const decoded = verifyAndDecodeToken({ context });
        return next(result, args, { ...context, user: decoded }, info);
      };
    });
  }

  visitFieldDefinition(field) {
    const next = field.resolve;

    field.resolve = function (result, args, context, info) {
      const decoded = verifyAndDecodeToken({ context });
      return next(result, args, { ...context, user: decoded }, info);
    };
  }
}

module.exports = IsUnAuthenticatedDirective;
