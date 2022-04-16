const {isNMP} = require("./nmp");

export const playwireAds = isNMP ? [] : ["NA"];
export const nitropayAds = isNMP ? [] : ["KR"];
export const adsenseAds = isNMP ? [] : ["EUW", "BR", "LAN", "LA1", "LAS", "LA2", "EUNE",
    "JP", "OCE", "OC1", "TR", "RU", "TENCENT", "TW", "VN", "SG", "PH", "TH", "ID"];