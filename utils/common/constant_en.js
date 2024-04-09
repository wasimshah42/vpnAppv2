const constants = {
    CAPTCHA_SECRET: "ABC",
    USER_REG_TEXT: "Thank you! Please use the below User ID and Password to access or complete your Amex Card online application.",
    SAUDI_INCOME_LIMIT: 8000,
    NON_SAUDI_INCOME_LIMIT: 10000
};

module.exports = function (key) {
    return constants[key];
};
