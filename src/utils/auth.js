const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { jwtSecret, jwtExpiresIn } = require("../config/application");

const auth = {
  /**
   * Generate hash password
   * @param password: string
   * @param salt: number
   * @return hash password
   */
  hashPassword(password, saltRounds = 10) {
    return bcrypt
      .genSalt(saltRounds)
      .then((salt) => bcrypt.hash(password, salt))
      .then((hash) => hash);
  },

  /**
   * Compare password for validation
   *
   * @param hashPassword : String
   * @param password : String
   * @returns boolean
   */
  comparePassword(hashPassword, password) {
    return bcrypt.compareSync(password, hashPassword);
  },
  /**
   * Generate token for user
   *
   * @param {number} userID
   * @param {string} type
   * @return token string
   */
  generateToken(data) {
    const token = jwt.sign(
      { ...data },
      jwtSecret,
      { algorithm: "HS256" },
      { expiresIn: jwtExpiresIn }
    );
    return token;
  },
};

module.exports = auth;
