const {isNMP} = require("./nmp");

let countryHasAdsAdsense = ["NA", "KR"];
// let countryHasAdsAdsense = ["NA"];
// let countryHasAdsAdsense = [];

if (isNMP) {
    countryHasAdsAdsense = ["NA", "KR"];
}

exports.countryHasAdsAdsense = countryHasAdsAdsense;