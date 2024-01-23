/*******************************************************/
const axios = require("axios");
//*******************************************************/
//Network Requests.
/*******************************************************/
const post = async (url, body) => {
    return await axios.post(url, body, {
        headers: {
            "Content-Type": 'application/json',
            "Accept": 'application/json'
        }
    });
}
const get = async (url, req) => {
    let params = "";
    //--------------------------//
    const headers = {
        "Content-Type": 'application/json',
        "Accept": '*/*'
    };
    return await axios.get(url,
        {
            headers: headers
        },
        {
            params: params
        }
    ).then((result) => {
        return result;
    }).catch((err) => {
        return err.response;
    });
}
const getWithParams = async (url, req, params = "") => {
    //----------------------//
    const headers = {
        "Content-Type": 'application/json',
        "Accept": '*/*'
    };
    let config = {
        headers: headers,
        params: params,
    }
    return await axios.get(url,
        config
    ).then((result) => {
        return result;
    }).catch((err) => {
        return err.response;
    });
}
const postWithHeaders = async (url, req, header = null, body) => {
    const headers = {
        "Content-Type": 'application/json',
        "Accept": '*/*',
        "authentication": "aesa@321"
    };
    let config = {
        headers: headers
    }
    return await axios.post(url, body,
        config
    ).then((result) => {
        return result;
    }).catch((err) => {
        return err.response;
    });
}
/*******************************************************/
// Exporting.
/*******************************************************/
module.exports = {
    post,
    get,
    getWithParams,
    postWithHeaders
}