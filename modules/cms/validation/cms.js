const { body, param, query } = require('express-validator');
exports.validate = (method) => {
  switch (method) {
    case 'login': {
      return [
        body('email').not().isEmpty().trim().withMessage("Please enter Email"),
        body('password').not().isEmpty().trim().withMessage("Please enter Password"),
      ]
    }
    case 'register': {
      return [
        body('email').not().isEmpty().trim().withMessage("Please enter Email"),
        body('password').not().isEmpty().trim().withMessage("Please enter Password"),
        body('username').not().isEmpty().trim().withMessage("Please enter Username"),
        //--//
      ]
    }
  }
}