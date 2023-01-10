const {isNMP} = require("./nmp");

let countryHasAds = ["NA"];
// let countryHasAds = ["NA", "EUW", "BR", "LAN", "LA1", "LAS", "LA2", "EUNE", "JP", "OCE", "OC1", "TR", "RU", "TENCENT", "TW", "VN", "SG", "PH", "TH", "ID"];
// let countryHasAds = [];

if (isNMP) {
    countryHasAds = [];
}

exports.countryHasAds = countryHasAds;