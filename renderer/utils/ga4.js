import axios from "axios";
import {isOW} from "./ow";
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

// if (isOW) {
//     apiSecret = "EZVE38_8T82DZFuzPlRjaQ";
//     measurementId = "G-BMB4BWB60G";
// }

const userId = window.api.sendSync("get-ga").userId;
// const userId = "test";
let sendGA4Event = async (name, params, userProperties= {}) => {
    params.engagement_time_msec = "123";
    params.app_ver = window.api.sendSync("get-version-sync");
    let opggId = window.api.sendSync("opgg-id");
    params.op_mid = opggId ? parseInt(opggId) : null;

    let opggSummoner = window.api.sendSync("opgg-summoner");
    if (opggSummoner) {
        try {
            opggSummoner = JSON.parse(opggSummoner);
            params.op_sid = opggSummoner.summoner_id;
        } catch (_) {
            params.op_sid = null;
        }
    }

    let geo = window.api.sendSync("geo");
    if (geo) {
        try {
            geo = JSON.parse(geo);
            if (geo.countryCode === "KR") {
                params.ip = geo.ip;
            } else {
                params.ip = null;
            }
            params.countryCode = geo.countryCode;
            params.country = geo.country;
        } catch (_) {
            params.ip = null;
            params.countryCode = null;
            params.country = null;
        }
    } else {
        params.ip = null;
        params.countryCode = null;
        params.country = null;
    }

    let locale = window.api.sendSync("locale");
    if (locale) {
        params.language = locale;
    }  else {
        params.language = null;
    }

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

export default sendGA4Event;