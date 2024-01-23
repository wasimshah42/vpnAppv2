const dataReviver = function (key, input) {
    if (typeof input === "string") {
        let value = String(input).trim().toLowerCase();
        if (value === "null") { input = null; }
        else if (value === "true") { input = true; }
        else if (value === "false") { input = false; }
        else if (value === "undefined") { input = null; }
        //else if(!isNaN(input)){input = Number(value);}
        else { input = input.trim(); }
    }
    return input;
};
module.exports = dataReviver;
