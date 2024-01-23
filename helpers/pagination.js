let _defaults = function () {
    return {
        page: 0,
        pages: 0,
        count: 0,
        per_page: 20,
        sort_by: "id",
        sort_order: "DESC",
        setCount: function (count) {
            this.page++;
            this.count = count;
            this.pages = Math.ceil(this.count / this.per_page);
        }
    };
};
module.exports = function (req, query) {
    let pagination = new _defaults();
    if (req.query && req.query.page) {
        req.query.page = parseInt(req.query.page) || 0;
        if (req.query.page && req.query.page > 0) {
            pagination.page = req.query.page - 1;
        }
    }
    if (req.query && req.query.per_page) {
        req.query.per_page = parseInt(req.query.per_page) || 0;
        if (req.query.per_page && req.query.per_page > 0) {
            pagination.per_page = req.query.per_page;
        }
    }
    if (req.query && req.query.sort_by) {
        req.query.sort_by = String(req.query.sort_by).trim().toLowerCase();
        if (req.query.sort_by) {
            pagination.sort_by = req.query.sort_by;
        }
    }
    if (req.query && req.query.sort_order) {
        req.query.sort_order = String(req.query.sort_order).trim().toUpperCase();
        if (req.query.sort_order) {
            pagination.sort_order = req.query.sort_order;
        }
    }
    query.order = [[pagination.sort_by, pagination.sort_order]];
    query.offset = pagination.page * pagination.per_page;
    query.limit = pagination.per_page;
    return pagination;
};
