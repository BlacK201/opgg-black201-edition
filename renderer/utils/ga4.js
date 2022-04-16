import axios from "axios";
// const {ipcRenderer, remote} = globalThis.require('electron');
const {isNMP} = require("./nmp");

// let isNMP = remote.getGlobal('process').env.VERSION_STRING === "nmp";
// isNMP = true;

// console.log("a", isNMP);

// const apiSecret = "NGRkW5WIQlGSDHEQjV6Yrw";
// const measurementId = "G-4KV2V27WMY";

let apiSecret = "Nd-14GrFQHKMT1wSfCAY4g";
let measurementId = "G-1JBL3HLZDC";

if (isNMP) {
    apiSecret = "t8f8-_GXSOWWHfbNVkMh-g";
    measurementId = "G-M8W64MCD74";
}

const userId = window.api.sendSync("get-ga").userId;
// const userId = "test";
let sendGA4Event = async (name, params, userProperties= {}) => {
    params.engagement_time_msec = "123";
    params.app_ver = window.api.sendSync("get-version-sync");

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

export default sendGA4Event;