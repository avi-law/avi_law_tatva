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
      INVALID_FORGOT_PASSWORD_LINK:
        "The link to change your password is invalid - please request a password change again!.",
      INTERNAL_SERVER_ERROR: "Internal server error",
      INVALID_EMAIL_VERIFICATION_LINK:
        "The link to verify your email is invalid - please request a email verification again!.",
      FILE_NOT_FOUND: "File no found",
      EMAIL_ALREADY_EXISTS:
        "A User with this email-address already exists! Please change the user's email-address in order to create this user account",
      USER_HAS_ENTITLED_ALREADY:
        "This user has been entitled to use the website on behalf of your company already!",
      USER_ADDED_SUCCESSFULLY:
        "This user has now been added to your company successfully!",
      INCORRECT_OLD_PASSWORD: "You have enter incorrect old password",
      EMAIL_VERIFICATION_FAILED:
        "Your email address is not verified, Please verify your email address or resend verification click <a> here </a>",
      NL_EMAIL_ALREADY_SENT: "This Newsletter Email already sent to user",
      RULE_BOOK_ALREADY_EXISTS: "The rule book already exist",
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
      INVALID_FORGOT_PASSWORD:
        "Der Versand eines eMails an Sie war nicht möglich!",
      INVALID_FORGOT_PASSWORD_LINK:
        "Ungültiger Liink zum Ändern des Passwortes - bitte fordern Sie einen neuen Link zum Ändern Ihres Passwortes an.",
      INTERNAL_SERVER_ERROR: "Internal server error",
      FILE_NOT_FOUND: "File no found",
      EMAIL_ALREADY_EXISTS:
        "Es existiert bereits ein Benutzer mit dieser eMail-Adresse. Um das gewünschte Benutzerprofil erstellen zu können, wählen Sie bitte eine andere eMail-Adresse aus.",
      USER_HAS_ENTITLED_ALREADY:
        "Dieser User war bereits berechtigt, die Website namens Ihres Unternehmens zu nutzen!",
      USER_ADDED_SUCCESSFULLY:
        "Der Nutzer wurde Ihrem Kundenkonto hinzugefügt!",
      INCORRECT_OLD_PASSWORD: "You have enter incorrect old password",
      EMAIL_VERIFICATION_FAILED:
        "Your email address is not verified, Please verify your email address or resend verification click <a> here </a>",
      INVALID_EMAIL_VERIFICATION_LINK:
        "The link to verify your email is invalid - please request a email verification again!.",
      NL_EMAIL_ALREADY_SENT: "This Newsletter Email already sent to user",
      RULE_BOOK_ALREADY_EXISTS: "The rule book already exist",
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
    CREATE_CUSTOMER: 20,
    UPDATE_CUSTOMER: 21,
    CREATE_USER: 22,
    UPDATE_USER: 23,
    CREATE_INVOICE: 24,
    DELETE_INVOICE: 25,
    PAID_INVOICE: 26,
    CREATE_NL: 29,
    UPDATE_NL: 30,
    DELETE_NL: 31,
    CREATE_SOL: 33,
    UPDATE_SOL: 34,
    DELETE_SOL: 35,
    CREATE_BLOG: 37,
    UPDATE_BLOG: 38,
    DELETE_BLOG: 39,
    READ_NL: 40,
    READ_BLOG: 41,
  },
  LOGIN_FAILED_STATUS: {
    GTC_NOT_ACCEPTED: "GTC_NOT_ACCEPTED",
    GDPR_NOT_ACCEPTED: "GDPR_NOT_ACCEPTED",
  },
  NEWSLETTER_SERVICE_PATH: "service/news",
  NEWSLETTER_UNSUBSCRIBE_PATH: "unsubscribe",
  NL_CONTENT_TRANSFORM_LINK_REGEX: /\[\*NL_(.*?)\]/,
  NL_CONTENT_TRANSFORM_REFERENCE_LINK_REGEX: /\[\*L_(.*?)\]/,
  SEARCH_EXCLUDE_SPECIAL_CHAR_REGEX: /[\\'"]/g,
  RESET_PASSWORD_TOKEN_EXPIRY_HOUR: 24,
  FREE_SUBSCRIPTION_IN_MONTH: 1,
  CUSTOMER_VAT_PER_DE: 0.07,
  CUSTOMER_VAT_PER: 0.0,
  NL_LIMIT_ON_LANDING_PAGE: 6,
  TWITTER_LINK: `https://twitter.com/intent/follow?
  original_referer=https%3A%2F%2Favi-law.com%2F&ref_src=twsrc%5Etfw&screen_name=Avi_Law_com&tw_p=followbutton`,
  PROVISION_IMAGE_TITLE_EN: "Nur auf Englisch verfügbar",
  PROVISION_IMAGE_TITLE_GER: "Available in German only",
  NL_TITLE_NOT_AVAILABLE: {
    de: "(Dieser Newsletter ist auf Deutsch nicht verfügbar.)",
    en: "(This Newsletter is not available in English)",
  },
  BLOG_TITLE_NOT_AVAILABLE: {
    de: "(Dieser Blog ist auf Deutsch nicht verfügbar.)",
    en: "(This Blog is not available in English)",
  },
  SUBSCRIPTION_PLAN: {
    SINGLE: {
      cust_single: true,
      cust_rate: 10,
      cust_disc_perc: 0,
    },
    MULTIPLE: {
      cust_single: false,
      cust_rate: 20,
      cust_disc_perc: 0,
    },
    UNLIMITED: {
      cust_single: false,
      cust_rate: 50,
      cust_disc_perc: 0,
    },
  },
  EMAIL: {
    EN: {
      SALUTATION: {
        M: "Dear Mr.",
        F: "Dear Mrs.",
      },
      FORGOT_PASSWORD: {
        SUBJECT: "Avi-law - Password reset link",
        HEAD000: "Troubles logging in?",
        CONT010:
          "For resetting your password, click the button below and follow the instructions.",
        BUTT010: "CHANGE PASSWORD",
      },
      INVOICE: {
        INV_en_DE: {
          SUBJECT: "Invoice avi-law.com for the year {{year}}",
          CONT010: "Dear Ladies and Gentlemen,",
          CONT020:
            "Please find attached the invoice for our web-portal www.avi-law.com. we kindly ask you to pay this invoice within the next few days.",
          CONT030: "With best regards,",
          CONT040: "Joachim J. Janezic & Werner Klein",
        },
        INV_en_AT: {
          SUBJECT: "Invoice avi-law.com for the year {{year}}",
          CONT010: "Dear Ladies and Gentlemen,",
          CONT020:
            "Please find attached the invoice for our web-portal www.avi-law.com. we kindly ask you to pay this invoice within the next few days.",
          CONT030: "With best regards,",
          CONT040: "Joachim J. Janezic",
        },
      },
      CREATE_USER: {
        SUBJECT: "Your user-account at www.avi-law.com",
        CONT010:
          "your profile has been created to use www.avi-law on behalf of this company!",
        CONT020: "Please login to www.avi-law using below password",
        CONT050: "Password",
        FOOTER_TITLE: "Best regards,",
        FOOTER_SIGNATURE: "Joachim J. Janezic",
      },
      INVITED: {
        SUBJECT: "Invitation to www.avi-law.com",
        CONT010:
          "{{admin_user_name}} of {{customer_name}} has invited you to use www.avi-law on behalf of this company!",
        CONT020: "Please follow",
        CONT030: "this link",
        CONT040: "to complete your data.",
        FOOTER_TITLE: "Best regards,",
        FOOTER_SIGNATURE: "Joachim J. Janezic",
      },
      INVITATION_ACCEPTED: {
        SUBJECT: "Invitation to www.avi-law.com",
        CONT010:
          "We would like to inform you, that {{new_user_name}} has now accepted your invitation to use www.avi-law.com.",
        FOOTER_TITLE: "Best regards,",
        FOOTER_SIGNATURE: "Joachim J. Janezic",
      },
      ADDED_USER: {
        SUBJECT: "Your user-account at www.avi-law.com",
        CONT010:
          "{{admin_user_name}} has added you to the users who are entitled to use www.avi-law on behalf of {{customer_name}}!",
        CONT020:
          "This email is just for your information, no action from your side is required.",
        FOOTER_TITLE: "Best regards,",
        FOOTER_SIGNATURE: "Joachim J. Janezic",
      },
      REGISTRATION_VERIFICATION: {
        SUBJECT: "Registration confirmation",
        CONT010: "Thank you for having signed up to",
        CONT020: "www.avi-law.com",
        CONT060:
          "If you have questions, please do not hesitate to contact us via",
        CONT080:
          "Before being able to use your account you need to verify your email address by",
        CONT090: "clicking here",
        FOOTER_TITLE: "Best regards,",
        FOOTER_SIGNATURE: "Joachim J. Janezic",
      },
      RESEND_EMAIL_VERIFICATION_LINK: {
        SUBJECT: "Email-address verification",
        CONT010: "Please click the button below to verify your email-address.",
        CONT030:
          "If you have any question, please do not hesitate to contact us via",
        BUTT010: "Verify Email-address",
        FOOTER_TITLE: "Best regards,",
        FOOTER_SIGNATURE: "Joachim J. Janezic",
      },
      EMAIL_VERIFIED: {
        SUBJECT: "Email-address verified",
        CONT010: "You have verified the registered email-address.",
        CONT020:
          "The sign-up-process has been completed successfully and you are now able to use",
        CONT030: "https://www.avi-law.com/",
        CONT050: "We will send you an invoice in the next few days.",
        CONT060:
          "If you have any question, please do not hesitate to contact us via",
        FOOTER_TITLE: "Best regards,",
        FOOTER_SIGNATURE: "Joachim J. Janezic",
      },
      FOOTER: {
        HELP: "Do you need any help?",
        GET_IN_TOUCH: "Get in touch",
        VISIT_US: "Visit us at:",
        EMAIL_US: "Email us at:",
        GIVE_CALL: "Give us a call:",
        ADDRESS1: "Grieskai 76",
        ADDRESS2: "8020 Graz, Austria",
        COPYRIGHT: "Copyright",
        UNSUBSCRIBE_CONTENT:
          "If you would like to unsubscribe from our newsletter service, click",
        UNSUBSCRIBE: "here.",
      },
    },
    DE: {
      SALUTATION: {
        M: "Sehr geehrter Herr",
        F: "Sehr geehrte Frau",
      },
      FORGOT_PASSWORD: {
        SUBJECT: "Avi-law - Link zum Zurücksetzen Ihres Passwortes",
        HEAD000: "Probleme beim Login?",
        CONT010:
          "Zum Zurücksetzen Ihres Passwortes klicken Sie hier und folgen Sie den Anweisungen.",
        BUTT010: "PASSWORT ÄNDERN",
      },
      INVOICE: {
        INV_de_DE: {
          SUBJECT: "Rechnung avi-law.com für das Jahr {{year}}",
          CONT010: "Sehr geehrte Damen und Herren,",
          CONT020:
            "Anbei erhalten Sie die Rechnung für die Benützung unserer Web-Plattform www.avi-law.com für das Jahr 2021 mit der Bitte um baldige Begleichung.",
          CONT030: "Mit freundlichen Grüßen,",
          CONT040: "Joachim J. Janezic & Werner Klein",
        },
        INV_de_AT: {
          SUBJECT: "Rechnung avi-law.com für das Jahr {{year}}",
          CONT010: "Sehr geehrte Damen und Herren,",
          CONT020:
            "Anbei erhalten Sie die Rechnung für die Benützung unserer Web-Plattform www.avi-law.com für das Jahr 2021 mit der Bitte um baldige Begleichung.",
          CONT030: "Mit freundlichen Grüßen,",
          CONT040: "Joachim J. Janezic",
        },
      },
      INVITED: {
        SUBJECT: "Einladung für www.avi-law.com",
        CONT010:
          "{{admin_user_name}} hat Sie namens {{customer_name}} zur Benützung von www.avi-law.com eingeladen.",
        CONT020: "Bitte folgen Sie",
        CONT030: "dem Link",
        CONT040: "um Ihre Benutzerdaten zu vervollständigen.",
        FOOTER_TITLE: "Mit freundlichen Grüßen,",
        FOOTER_SIGNATURE: "Joachim J. Janezic",
      },
      INVITATION_ACCEPTED: {
        SUBJECT: "Einladung für www.avi-law.com“",
        CONT010:
          "Wir dürfen Sie informieren {{new_user_name}} Ihre Einladung zur Benützung von www.avi-law.com nun angenommen hat.",
        FOOTER_TITLE: "Mit freundlichen Grüßen,",
        FOOTER_SIGNATURE: "Joachim J. Janezic",
      },
      ADDED_USER: {
        SUBJECT: "Ihr Benutzer-Account auf www.avi-law.com",
        CONT010:
          "{{admin_user_name}} hat Sie zur Benützung von www.avi-law.com für {{customer_name}} berechtigt!",
        CONT020:
          "Dieses eMail dient lediglich Ihrer Information. Es sind keine weiteren Aktionen Ihrerseits notwendig.",
        FOOTER_TITLE: "Mit freundlichen Grüßen,",
        FOOTER_SIGNATURE: "Joachim J. Janezic",
      },
      CREATE_USER: {
        SUBJECT: "Ihr Benutzer-Account auf www.avi-law.com",
        CONT010:
          "your profile has been created to use www.avi-law on behalf of this company!",
        CONT020: "Please login to www.avi-law using below password",
        CONT050: "Password",
        FOOTER_TITLE: "Best regards,",
        FOOTER_SIGNATURE: "Joachim J. Janezic",
      },
      REGISTRATION_VERIFICATION: {
        SUBJECT: "Anmeldebestätigung",
        CONT010: "Danke, dass Sie sich für",
        CONT020: "www.avi-law.com",
        CONT030: "entschieden haben.",
        CONT060:
          "Wenn Sie Fragen haben, stehen wir Ihnen jederzeit gerne unter",
        CONT070: "zur Verfügung.",
        CONT080:
          "Bevor Sie Ihren Zugang verwenden können, müssen Sie Ihre eMail-Adresse bestätigen. Bitte klicken Sie ",
        CONT090: "hier.",
        FOOTER_TITLE: "Mit freundlichen Grüßen,",
        FOOTER_SIGNATURE: "Joachim J. Janezic",
      },
      RESEND_EMAIL_VERIFICATION_LINK: {
        SUBJECT: "Bestätigung Ihrer eMail-Adresse",
        CONT010:
          "Zur Bestätigung Ihrer eMail-Adresse klicken Sie bitte den unten stehenden Button.",
        CONT030:
          "Wenn Sie Fragen haben, stehen wir Ihnen jederzeit gerne unter",
        CONT040: "zur Verfügung.",
        BUTT010: "eMail-Adresse bestätigen",
        FOOTER_TITLE: "Mit freundlichen Grüßen,",
        FOOTER_SIGNATURE: "Joachim J. Janezic",
      },
      EMAIL_VERIFIED: {
        SUBJECT: "EMail-Adresse bestätigt",
        CONT010: "Sie haben Ihre eMail-Adresse erfolgreich bestätigt.",
        CONT020:
          "Der Registrierungs-Prozess ist nun erfolgreich abgeschlossen. Sie können ",
        CONT030: "https://www.avi-law.com/",
        CONT040: "ab sofort benutzen.",
        CONT050:
          "Wir werden Ihnen in den nächsten Tagen eine Rechnung übermitteln.",
        CONT060:
          "Wenn Sie Fragen haben, stehen wir Ihnen jederzeit gerne unter",
        CONT070: "zur Verfügung.",
        FOOTER_TITLE: "Mit freundlichen Grüßen,",
        FOOTER_SIGNATURE: "Joachim J. Janezic",
      },
      FOOTER: {
        HELP: "Benötigen Sie Hilfe?",
        GET_IN_TOUCH: "Nehmen Sie Kontakt mit uns auf!",
        VISIT_US: "Besuchen Sie uns:",
        EMAIL_US: "Schreiben Sie uns ein eMail:",
        GIVE_CALL: "Rufen Sie uns an:",
        ADDRESS1: "Grieskai 76",
        ADDRESS2: "8020 Graz, Austria",
        COPYRIGHT: "Copyright",
        UNSUBSCRIBE_CONTENT:
          "Wenn Sie unseren Newsletter abbestellen wollen, klicken Sie hier",
        UNSUBSCRIBE: "hier.",
      },
    },
  },
  PDF: {
    INV_de_AT: {
      BANNER: `assets/logos/logo-avi-law.jpg`,
      CONT010: "per eMail:",
      CONT020: "Graz, am",
      CONT030: "Rechnung Zugang avi-law.com inklusive Newsletter für das Jahr",
      CONT040: "Rechnung für",
      CONT050: "Leistungszeitraum:",
      CONT060: "Rechnungsnummer:",
      CONT070: "Ihre UID:",
      CONT080: "Ihre Kostenstelle:",
      CONT090: "Wir erlauben uns, Ihnen für unsere Leistungen im Jahr",
      CONT100: "vereinbarungsgemäß folgenden Betrag in Rechnung zu stellen:",
      CONT110: "Anzahl der Monate:",
      CONT120: "x Tarif:",
      CONT130: "Jahresbetrag netto (ohne USt.)",
      CONT140: "abzgl.",
      CONT150: "% Preisnachlass",
      CONT160: "Rechnungsbetrag netto (ohne USt.)",
      CONT170: "zzgl.",
      CONT180: "% USt.",
      CONT190: "Gesamtrechnungsbetrag",
      CONT200:
        "Der Rechnungsbetrag ist gem. § 6 Abs. 1 Z 27 UStG von der Umsatzsteuer befreit.",
      CONT210:
        "Wir ersuchen Sie höflichst um Einzahlung des Rechnungsbetrages auf unser Konto bei der Steiermärkischen Bank und Sparkassen AG, IBAN: AT32 2081 5021 0042 0682, BIC: STSPAT2G.",
      CONT220: "Mit freundlichen Grüßen,",
      CONT230: "Joachim J. Janezic",
      CONT240:
        "Institut für Österreichisches und Internationales Luftfahrtrecht",
      CONT250: "Grieskai 76, 8020 Graz, Österreich",
      CONT260: "https://www.avi-law.com/",
      CONT270: "bis",
      CONT280: "",
      CONT290: "Ihre Bestellnummer:",
      CONT300: "",
    },
    INV_de_DE: {
      BANNER: `assets/logos/banner-logo.jpg`,
      CONT010: "per eMail:",
      CONT020: "Ismaning, am",
      CONT030:
        "Rechnung Zugang avi-law.com (vormals luftverkehr.de) für das Jahr",
      CONT040: "Rechnung für",
      CONT050: "Leistungszeitraum:",
      CONT060: "Rechnungsnummer:",
      CONT070: "Ihre UID:",
      CONT080: "Ihre Kostenstelle:",
      CONT090: "Wir erlauben uns, Ihnen für unsere Leistungen im Jahr",
      CONT100: "vereinbarungsgemäß folgenden Betrag in Rechnung zu stellen:",
      CONT110: "Anzahl der Monate:",
      CONT120: "x Tarif:",
      CONT130: "Jahresbetrag netto (ohne USt.)",
      CONT140: "abzgl.",
      CONT150: "% Preisnachlass",
      CONT160: "Rechnungsbetrag netto (ohne USt.)",
      CONT170: "zzgl.",
      CONT180: "% USt.",
      CONT190: "Gesamtrechnungsbetrag",
      CONT200: "",
      CONT210:
        "Wir ersuchen Sie höflichst um Einzahlung des Rechnungsbetrages auf unser Konto bei der Postbank München, IBAN: DE08 1001 0010 0194 1321 34, BIC: PBNKDEFF.",
      CONT220: "Mit freundlichen Grüßen,",
      CONT230: "Werner Klein",
      CONT240: "Verlag Luftverkehr, Inhaber Werner Klein",
      CONT250: "Auenstraße 71, 85737 Ismaning, Deutschland",
      CONT260: "https://www.avi-law.com/",
      CONT270: "bis",
      CONT280: "",
      CONT290: "Ihre Bestellnummer:",
      CONT300: "UID DE274785644",
    },
    INV_en_AT: {
      BANNER: `assets/logos/logo-avi-law.jpg`,
      CONT010: "per email:",
      CONT020: "Graz, the",
      CONT030:
        "Invoice for your access to avi-law.com including newsletter-service for the year",
      CONT040: "Invoice for",
      CONT050: "Term of invoice:",
      CONT060: "Invoice-ID:",
      CONT070: "Your VAT-ID:",
      CONT080: "Your cost center:",
      CONT090: "We hereby send you the invoice for our services for the year",
      CONT100: "according the terms of your subscription:",
      CONT110: "No of months:",
      CONT120: "x monthly rate:",
      CONT130: "Amount per year net (w/o VAT)",
      CONT140: "less ",
      CONT150: "% of discount",
      CONT160: "Invoice amount net (w/o VAT USt.)",
      CONT170: "plus",
      CONT180: "% VAT",
      CONT190: "Total invoice amount",
      CONT200:
        "This amount is free of VAT according to § 6 (1) No 27 of the Austrian Act on VAT.",
      CONT210:
        "We  kindly  ask  you  to  pay  the  total  amount  of  this  invoice  to  our  bank  account  at  Steiermärkische  Bank  und Sparkassen AG, IBAN: AT32 2081 5021 0042 0682, BIC: STSPAT2G.",
      CONT220: "With best regards,",
      CONT230: "Joachim J. Janezic",
      CONT240:
        "Institut für Österreichisches und Internationales Luftfahrtrecht",
      CONT250: "Grieskai 76, 8020 Graz, Österreich",
      CONT260: "https://www.avi-law.com/",
      CONT270: "to",
      CONT280: "from",
      CONT290: "Your order number:",
      CONT300: "",
    },
    INV_en_DE: {
      BANNER: `assets/logos/banner-logo.jpg`,
      CONT010: "via eMail:",
      CONT020: "Ismaning, the",
      CONT030:
        "Invoice for your access to avi-law.com (former known as luftverkehr.com) for the year",
      CONT040: "Invoice for",
      CONT050: "Term of invoice:",
      CONT060: "Invoice-ID:",
      CONT070: "Your VAT-ID:",
      CONT080: "Your cost center:",
      CONT090: "We hereby send you the invoice for our services for the year",
      CONT100: "according the terms of your subscription:",
      CONT110: "No of months:",
      CONT120: "x monthly rate:",
      CONT130: "Amount per year net (w/o VAT)",
      CONT140: "less ",
      CONT150: "% of discount",
      CONT160: "Invoice amount net (w/o VAT USt.)",
      CONT170: "plus",
      CONT180: "% VAT",
      CONT190: "Total invoice amount",
      CONT200: "",
      CONT210:
        "We kindly ask you to pay the total amount of this invoice to our bank account at Postbank München, IBAN: DE08 1001 0010 0194 1321 34, BIC: PBNKDEFF.",
      CONT220: "With best regards,",
      CONT230: "Werner Klein",
      CONT240: "Verlag Luftverkehr, Inhaber Werner Klein",
      CONT250: "Auenstraße 71, 85737 Ismaning, Deutschland",
      CONT260: "https://www.avi-law.com/",
      CONT270: "to",
      CONT280: "from",
      CONT290: "Your order number:",
      CONT300: "UID DE274785644",
    },
    FOOTER_DE: {
      CONT240:
        "Institut für Österreichisches und Internationales Luftfahrtrecht",
      CONT250: "Grieskai 76, 8020 Graz, Österreich",
      CONT260: "https://www.avi-law.com/",
      CONT300: "",
    },
    FOOTER_EN: {
      CONT240:
        "Institut für Österreichisches und Internationales Luftfahrtrecht",
      CONT250: "Grieskai 76, 8020 Graz, Österreich",
      CONT260: "https://www.avi-law.com/",
      CONT300: "",
    },
    NL_INFO_DE: {
      CREATOR: "erstellt am",
      UPDATER: "zuletzt bearbeitet am",
      BY: "durch",
    },
    NL_INFO_EN: {
      CREATOR: "created",
      UPDATER: "last edited",
      BY: "by",
    },
  },
};
