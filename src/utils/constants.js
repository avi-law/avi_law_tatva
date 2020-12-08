module.exports = {
  MESSAGE: {
    EN: {
      LOGIN_SUCCESS: "Login successfully.",
      INVALID_LOGIN_EMAIL: "Invalid login email address.",
      INVALID_LOGIN_PASSWORD: "Invalid login password.",
      USER_NOT_FOUND: "User not found",
      USER_ACCOUNT_EXPIRED:
        "Your user account has expired. For renewal, please contact office@avi-law.com.",
      CUSTOMER_LINKED_ACCOUNT_EXPIRED:
        "The account for the customer you are linked to has expired. For renewal, please contact office@avi-law.com.",
      GTC_NOT_ACCEPTED:
        "The account for the customer you are linked to has expired. For renewal, please contact office@avi-law.com.",
      GDPR_NOT_ACCEPTED:
        "The usage of our website requires the prior acceptance of our data protection policy.",
      INVALID_REQUEST: "Sorry, your request is invalid",
      INVALID_AUTHORIZATION_TOKEN: "Invalid authentication token",
      NO_AUTHORIZATION_TOKEN: "No authentication token",
      AUTHORIZATION_TOKEN_EXPIRED: "Authentication token expired",
      INCORRECT_LOGIN_DATA: "Your login data is incorrect!",
      INVALID_FORGOT_PASSWORD: "Your password could not be sent!",
      INVALID_FORGOT_PASSWORD_LINK: "Invalid reset password link.",
    },
    DE: {
      INVALID_LOGIN_EMAIL: "Die eingegebene eMail-Adresse ist nicht korrekt!",
      INVALID_LOGIN_PASSWORD: "Das eingegebene Passwort ist nicht korrekt!",
      LOGIN_SUCCESS: "Anmeldung erfolgreich.",
      USER_NOT_FOUND: "Der Benutzer konnte nicht gefunden werden.",
      GDPR_NOT_ACCEPTED:
        "Die Benützung unseres Webportals setzt voraus, dass Sie unsere Datenschutzbestimmungen akzeptieren.",
      USER_ACCOUNT_EXPIRED:
        "Ihr Benutzerzugang ist abgelaufen. Für eine Verlängerung kontaktieren Sie uns bitte per eMail unter office@avi-law.com.",
      CUSTOMER_LINKED_ACCOUNT_EXPIRED:
        "Der Zugang des Kunden, für den Sie sich einloggen wollen, ist abgelaufen. Für eine Verlängerung kontaktieren Sie uns bitte per eMail unter office@avi-law.com.",
      GTC_NOT_ACCEPTED:
        "Der für Ihren Kunden-Account zuständige Administrator muss vor der Benützung der Website unsere „Allgemeinen Nutzungsbedingungen“ annehmen. Sollten Sie dazu Fragen haben, kontaktieren Sie uns bitte per eMail unter office@avilaw.com.",
      INVALID_REQUEST: "Entschuldigung, Ihre Anfrage ist ungültig",
      INVALID_AUTHORIZATION_TOKEN: "Ungültiges Authentifizierungstoken",
      INCORRECT_LOGIN_DATA:
        "Die von Ihnen eingegebenen Anmeldedaten sind inkorrekt!",
      INVALID_FORGOT_PASSWORD: "Ihr Passwort konnte nicht versendet werden!",
      INVALID_FORGOT_PASSWORD_LINK:
        "Ihr Passwort konnte nicht versendet werden!",
    },
  },
  LOG_TYPE_ID: {
    LOGIN_WITH_WRONG_CREDENTIALS: 4,
    LOGIN_WITH_WRONG_PASSWORD: 5,
    LOGIN_SUCCESS: 6,
    USER_ACCOUNT_EXPIRED: 7,
    CUSTOMER_LINKED_ACCOUNT_EXPIRED: 8,
    GDPR_NOT_ACCEPTED: 9,
    GDPR_ACCEPTED: 10,
    GTC_NOT_ACCEPTED: 11,
    CUSTOMER_GTC_NOT_ACCEPTED: 13,
    ADMIN_USER_GTC_NOT_ACCEPTED: 14,
    ADMIN_CUSTOMER_GTC_NOT_ACCEPTED: 12,
    GTC_ACCEPTED: 15,
    ADMIN_CUSTOMER_GTC_ACCEPTED: 16,
  },
  LOGIN_FAILED_STATUS: {
    GTC_NOT_ACCEPTED: "GTC_NOT_ACCEPTED",
    GDPR_NOT_ACCEPTED: "GDPR_NOT_ACCEPTED",
  },
  RESET_PASSWORD_TOKEN_EXPIRY_HOUR: 1,
  EMAIL: {
    RESET_PASSWORD_SUBJECT: "Avi-law - Password reset link",
  },
};
