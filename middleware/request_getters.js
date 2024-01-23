module.exports = async function (req, res, next) {
    req.getBody = function (key, _default) {
        let value = req.body[key];
        if (value) { return value; }
        if (value === 0 || value === "0") { return value; }
        return _default;
    };
    req.getQuery = function (key, _default) {
        let value = req.query[key];
        if (value) { return value; }
        if (value === 0 || value === "0") { return value; }
        return _default;
    };
    req.getParam = function (key, _default) {
        let value = req.params[key];
        if (value) { return value; }
        if (value === 0 || value === "0") { return value; }
        return _default;
    };
    req.getHeader = function (key, _default) {
        let value = req.headers[key];
        if (value) { return value; }
        if (value === 0 || value === "0") { return value; }
        return _default;
    };
    return next();
};
