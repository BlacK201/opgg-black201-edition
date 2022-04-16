const {default: axios} = require("axios");
const {v4} = require("uuid");
const { LocalStorage } = require("node-localstorage");
const {app} = require("electron");
const sessionStorage = new LocalStorage(`${app.getPath("userData")}/session`);
const {isNMP} = require("../../renderer/utils/nmp");

// let isNMP = process.env.VERSION_STRING === "nmp";
// isNMP = true;
// console.log("t", isNMP);

// const apiSecret = "NGRkW5WIQlGSDHEQjV6Yrw";
// const measurementId = "G-4KV2V27WMY";

let apiSecret = "Nd-14GrFQHKMT1wSfCAY4g";
let measurementId = "G-1JBL3HLZDC";

if (isNMP) {
    apiSecret = "t8f8-_GXSOWWHfbNVkMh-g";
    measurementId = "G-M8W64MCD74";
}

const userId = sessionStorage.getItem('userid') || v4();

let sendGA4Event = async (name, params, userProperties= {}) => {
    params.engagement_time_msec = "123";
    params.app_ver = app.getVersion();

    let up = {};
    if (Object.keys(userProperties).length !== 0) {
        for (const [key, value] of Object.entries(userProperties)) {
            up[key] = {
                value: value
            }
        }
    }

    return await axios.post(`https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`, JSON.stringify({
        client_id: userId,
        user_id: userId,
        events: [{
            name: name,
            params: params
        }],
        user_properties: up
    })).then((res) => {
        if (res) {
            return res.data;
        }
    }).catch((err) => {
        return null;
    });
}

module.exports = {
    sendGA4Event
}