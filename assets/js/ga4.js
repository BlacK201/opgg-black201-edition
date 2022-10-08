const {default: axios} = require("axios");
const {v4} = require("uuid");
const { LocalStorage } = require("node-localstorage");
const {app} = require("electron");
const sessionStorage = new LocalStorage(`${app.getPath("userData")}/session`);
const {isNMP} = require("../../renderer/utils/nmp");
const {isOW} = require("../../renderer/utils/ow");

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

if (isOW) {
    apiSecret = "EZVE38_8T82DZFuzPlRjaQ";
    measurementId = "G-BMB4BWB60G";
}

const userId = sessionStorage.getItem('userid') || v4();
let sendGA4Event = async (name, params, userProperties= {}) => {
    params.engagement_time_msec = "123";
    params.app_ver = app.getVersion();

    let geo = sessionStorage.getItem("geo");
    if (geo) {
        try {
            geo = JSON.parse(geo);
            params.countryCode = geo.countryCode;
            params.country = geo.country;
            params.latitude = geo.latitude;
            params.longitude = geo.longitude;
        } catch (_) {
            params.countryCode = null;
            params.country = null;
            params.latitude = null;
            params.longitude = null;
        }
    } else {
        params.countryCode = null;
        params.country = null;
        params.latitude = null;
        params.longitude = null;
    }
    params.language = sessionStorage.getItem("locale") ?? null;

    let up = {};
    if (Object.keys(userProperties).length !== 0) {
        for (const [key, value] of Object.entries(userProperties)) {
            up[key] = {
                value: value === undefined ? null : value
            }
        }
    }

    for (const [key, value] of Object.entries(params)) {
        params[key] = value === null ? undefined : value;
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