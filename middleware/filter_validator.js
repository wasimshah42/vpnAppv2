const { validationResult } = require('express-validator');
module.exports = (req, res, next) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errors_array = errors.array();
        let response = {
            status: 400,
            message: "Validation Errors",
            data: null
        };
        if (errors_array && errors_array.length > 0) {
            // response.data = errors_array[0];
            response.message = errors_array[0]['msg'];
            req.statusMessage = errors_array[0]['msg'];
        }
        next(422);
    }
    next();
};
