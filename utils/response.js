const server_config = require("./../config/server");
//--//
module.exports = class {
    constructor() {
        this.status = null;
        this.statusCode = null;
        this.message = null;
        this.data = null;
        this.error = null;
    };
    setSuccess(data, message, statusCode) {
        this.status = "success";
        this.statusCode = statusCode || 200;
        this.message = message || "OK";
        this.data = data;
        this.error = null;
        return this;
    };
    setError(error, message, statusCode) {
        this.status = "error";
        this.statusCode = statusCode || 500;
        this.message = message || "Error";
        this.data = null;
        this.error = error;
        return this;
    };
    sendRes(req, res) {
        let result = {
            status: this.status,
            statusCode: this.statusCode,
            message: this.message,
            data: this.data,
            error: this.error
        };
        if(req.statusMessage && req.statusMessage !== ""){result.message = req.statusMessage;}
        // if(!server_config.enc_enabled){req.enc_password = "";}
        if (req.enc_password && req.enc_password !== "") {
            let password = req.enc_password;
            if (result.data) {
                result.data = JSON.stringify(result.data);
            }
            else if (result.error) {
                result.error = JSON.stringify(result.error);
            }
        }
        res._body = result;
        return res.status(this.statusCode).json(result);
    }
};
