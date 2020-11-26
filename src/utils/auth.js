const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { jwtSecret, jwtExpiresIn } = require('../config/application');

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
      .then((salt) => {
        return bcrypt.hash(password, salt);
      })
      .then((hash) => {
        return hash;
      });
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
  generateToken(user) {
    const token = jwt.sign(
      {
        user_id: user.user_id || 0,
        user_email: user.user_email,
        user_1st_lang: user.user_1st_lang,
        user_2nd_lang: user.user_2nd_lang,
        user_pref_country: user.user_pref_country
      },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );
    return token;
  },
};

module.exports = auth;
