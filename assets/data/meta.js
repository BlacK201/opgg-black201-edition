const {default: axios} = require("axios");
const fs = require("fs");

const kr = require("../i18n/locales/kr.json");
const en = require("../i18n/locales/en.json");
const de = require("../i18n/locales/de.json");
const es = require("../i18n/locales/es.json");
const fr = require("../i18n/locales/fr.json");
const ja = require("../i18n/locales/ja.json");
const pl = require("../i18n/locales/pl.json");
const pt = require("../i18n/locales/pt.json");
const ru = require("../i18n/locales/ru.json");
const sc = require("../i18n/locales/sc.json");
const tc = require("../i18n/locales/tc.json");
const tr = require("../i18n/locales/tr.json");
let i18nLocales = {
    kr: kr,
    en: en,
    de: de,
    es: es,
    fr: fr,
    ja: ja,
    pl: pl,
    pt: pt,
    ru: ru,
    sc: sc,
    tc: tc,
    tr: tr
};

let locales = [
    ["ko_KR", "kr", "kr", "ko_kr"],
    ["en_US", "en", "na", "default"],
    ["de_DE", "de", "eune", "de_de"],
    ["es_ES", "es", "las", "es_es"],
    ["fr_FR", "fr", "euw", "fr_fr"],
    ["ja_JP", "ja", "jp", "ja_jp"],
    ["pl_PL", "pl", "euw", "pl_pl"],
    ["pt_BR", "pt", "las", "pt_br"],
    ["pt_BR", "pt", "las", "pt_br"],
    ["ru_RU", "ru", "ru", "ru_ru"],
    ["zh_CN", "sc", "kr", "zh_cn"],
    ["zh_TW", "tc", "kr", "zh_tw"],
    ["tr_TR", "tr", "tr", "tr_tr"]
];

let callAPI = function(method, url, data=null) {
    return new Promise(function(resolve, reject) {
        axios({
            method: method,
            url: `${url}`,
            data: data
        }).then(function (response) {
            resolve(response);
        }).catch(function (error) {
            reject(error);
        }).finally(function () {

        });
    });
};

let saveRunes = (locale) => {
    callAPI("GET", `https://lol-api-champion.op.gg/api/meta/runes?hl=${locale[0]}`).then((response) => {
        fs.writeFile("./assets/data/meta/runes.json", JSON.stringify(response.data, null, 2), (err) => {
            console.log(err);
        });
    }).catch((err) => {
        console.log("[ERR] opgg meta runes", err);
    });
};

let saveRunePages = (locale) => {
    callAPI("GET", `https://lol-api-champion.op.gg/api/meta/rune-pages?hl=${locale[0]}`).then((response) => {
        fs.writeFile("./assets/data/meta/runePages.json", JSON.stringify(response.data, null, 2), (err) => {
            console.log(err);
        });
    }).catch((err) => {
        console.log("[ERR] opgg meta rune pages", err);
    });
};

let saveChampions = (locale) => {
    callAPI("GET", `https://lol-api-champion.op.gg/api/meta/champions?hl=${locale[0]}`).then((response) => {
        fs.writeFile("./assets/data/meta/champions.json", JSON.stringify(response.data, null, 2), (err) => {
            console.log(err);
        });
    }).catch((err) => {
        console.log("[ERR] opgg meta champions", err);
    });
};

let saveItems = (locale) => {
    callAPI("GET", `https://lol-api-champion.op.gg/api/meta/items?hl=${locale[0]}`).then((response) => {
        fs.writeFile("./assets/data/meta/items.json", JSON.stringify(response.data, null, 2), (err) => {
            console.log(err);
        });
    }).catch((err) => {
        console.log("[ERR] opgg meta items", err);
    });
};

let saveSpells = (locale) => {
    callAPI("GET", `https://lol-api-champion.op.gg/api/meta/spells?hl=${locale[0]}`).then((response) => {
        fs.writeFile("./assets/data/meta/spells.json", JSON.stringify(response.data, null, 2), (err) => {
            console.log(err);
        });
    }).catch((err) => {
        console.log("[ERR] opgg meta spells", err);
    });
};

if (process.env.NODE_ENV === "development") {
    locales.forEach((locale) => {
        if (locale[1] === "kr") {
            saveRunes(locale);
            saveChampions(locale);
            saveItems(locale);
            saveSpells(locale);
            saveRunePages(locale);
        }
    });
}