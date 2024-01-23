module.exports = function (promise) {
    return promise.then(function (data) {
        return Promise.resolve([data, undefined]);
    }).catch(function (error) {
        return Promise.resolve([undefined, error]);
    });
};
