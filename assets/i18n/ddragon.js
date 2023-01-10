const { app } = require('electron');
const axios = require('axios').default;
const { LocalStorage } = require('node-localstorage');
const nodeStorage = new LocalStorage(`${app.getPath("userData")}/data`);
const fs = require('fs');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log("[DDRAGON] download assets");
console.log(`${app.getPath("userData")}/data`);

const kr = require("./locales/kr.json");
const en = require("./locales/en.json");
const de = require("./locales/de.json");
const es = require("./locales/es.json");
const fr = require("./locales/fr.json");
const ja = require("./locales/ja.json");
const pl = require("./locales/pl.json");
const pt = require("./locales/pt.json");
const ru = require("./locales/ru.json");
const sc = require("./locales/sc.json");
const tc = require("./locales/tc.json");
const tr = require("./locales/tr.json");
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

// ddragon, app, riot region, community dragon
let locales = [
    ["ko_KR", "kr", "kr", "ko_kr"],
    ["en_US", "en", "na", "default"],
    ["de_DE", "de", "eune", "de_de"],
    ["es_ES", "es", "las", "es_es"],
    ["fr_FR", "fr", "euw", "fr_fr"],
    ["ja_JP", "ja", "jp", "ja_jp"],
    ["pl_PL", "pl", "euw", "pl_pl"],
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

let saveChampionJson = (cdn, v, locale) => {
    callAPI("GET", `${cdn}/${v}/data/${locale[0]}/champion.json`).then((response) => {
        nodeStorage.setItem(`champion_${locale[1]}.json`, JSON.stringify(response.data));

        i18nLocales[locale[1]]["champions"] = {};
        for (const [key, value] of Object.entries(response.data.data)) {
            i18nLocales[locale[1]]["champions"][value.key] = value.name;
        }
        fs.writeFile(`./assets/i18n/locales/${locale[1]}.json`, JSON.stringify(i18nLocales[locale[1]], null, 2), (err) => {
            if (err) {
                console.log(err);
            }
        });
    }).catch((err) => {
        console.log("[ERR] ddragon champions", err);
    });
};

let saveItemsJson = (cdn, v, locale) => {
    callAPI("GET", `${cdn}/${v}/data/${locale[0]}/item.json`).then((response) => {
        nodeStorage.setItem(`item_${locale[1]}.json`, JSON.stringify({
            "version": response.data.version
        }));

        let goldString = "골드";
        if (locale[1] !== "kr") {
            goldString = "Gold";
        }
        i18nLocales[locale[1]]["items"] = {};
        for (const [key, value] of Object.entries(response.data.data)) {
            i18nLocales[locale[1]]["items"][key] = {
                "name": value.name,
                "desc": value.description,
                "gold": value.gold.total,
                "tooltip": `<div class='tooltip-title'>${value.name}</div>${value.description}<div class='tooltip-gold'>${value.gold.total} ${goldString}</div>`
            };
        }
        fs.writeFile(`./assets/i18n/locales/${locale[1]}.json`, JSON.stringify(i18nLocales[locale[1]], null, 2), (err) => {
            if (err) {
                console.log(err);
            }
        });
    }).catch((err) => {
        console.log("[ERR] ddragon items", err);
    });
};

let saveSpellsJson = (cdn, v, locale) => {
    callAPI("GET", `${cdn}/${v}/data/${locale[0]}/summoner.json`).then((response) => {
        nodeStorage.setItem(`spell_${locale[1]}.json`, JSON.stringify({
            "version": response.data.version
        }));

        i18nLocales[locale[1]]["spells"] = {};
        for (const [key, value] of Object.entries(response.data.data)) {
            i18nLocales[locale[1]]["spells"][key] = {
                "name": value.name,
                "desc": value.description,
                "tooltip": `<div class='tooltip-title'>${value.name}</div>${value.description}`
            };
        }
        fs.writeFile(`./assets/i18n/locales/${locale[1]}.json`, JSON.stringify(i18nLocales[locale[1]], null, 2), (err) => {
            if (err) {
                console.log(err);
            }
        });
    }).catch((err) => {
        console.log("[ERR] ddragon spells", err);
    });
}

let savePerksJson = (locale) => {
    callAPI("GET", `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/${locale[3]}/v1/perks.json`).then((response) => {
        nodeStorage.setItem(`perk_${locale[1]}.json`, JSON.stringify({
            "version": response.data.version
        }));

        i18nLocales[locale[1]]["perks"] = {};
        response.data.forEach((perkData) => {
            i18nLocales[locale[1]]["perks"][perkData.id] = {
                "name": perkData.name,
                "desc": perkData.longDesc,
                "tooltip": `<div class='tooltip-title'>${perkData.name}</div>${perkData.longDesc}`
            };
        });
        fs.writeFile(`./assets/i18n/locales/${locale[1]}.json`, JSON.stringify(i18nLocales[locale[1]], null, 2), (err) => {
            if (err) {
                console.log(err);
            }
        });
    }).catch((err) => {
        console.log("[ERR] community ddragon perks", err);
    });

    callAPI("GET", `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/${locale[3]}/v1/perkstyles.json`).then((response) => {
        nodeStorage.setItem(`perkstyle_${locale[1]}.json`, JSON.stringify({
            "version": response.data.version
        }));

        i18nLocales[locale[1]]["perkStyles"] = {};
        response.data.styles.forEach((perkData) => {
            i18nLocales[locale[1]]["perkStyles"][perkData.id] = {
                "name": perkData.name,
                "desc": perkData.tooltip,
                "tooltip": `<div class='tooltip-title'>${perkData.name}</div>${perkData.tooltip}`
            };
        });
        fs.writeFile(`./assets/i18n/locales/${locale[1]}.json`, JSON.stringify(i18nLocales[locale[1]], null, 2), (err) => {
            if (err) {
                console.log(err);
            }
        });
    }).catch((err) => {
        console.log("[ERR] community ddragon perkStyles", err);
    });
};

let saveSkillsJson = (locale) => {
    callAPI("GET", `https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/skills/${locale[0]}/skills.json`).then((response) => {
        nodeStorage.setItem(`skill_${locale[1]}.json`, JSON.stringify({
            "version": response.data.version
        }));

        i18nLocales[locale[1]]["skills"] = {};
        for (const [key, value] of Object.entries(response.data.data)) {
            i18nLocales[locale[1]]["skills"][key] = value;
        }
        fs.writeFile(`./assets/i18n/locales/${locale[1]}.json`, JSON.stringify(i18nLocales[locale[1]], null, 2), (err) => {
            if (err) {
                console.log(err);
            }
        });
    }).catch((err) => {
        console.log("[ERR] desktop app skills", err);
    });
}

locales.forEach((locale) => {
    callAPI("GET", `https://ddragon.leagueoflegends.com/realms/${locale[2]}.json`).then((response) => {
        let v = response.data.n.champion
        let cdn = response.data.cdn;
    
        const json_champion = nodeStorage.getItem(`champion_${locale[1]}.json`);
        if (json_champion === null) {
            saveChampionJson(cdn, v, locale);
        } else {
            if (JSON.parse(json_champion).version !== v) {
                saveChampionJson(cdn, v, locale);
                // 버전 바뀌면 한번 갱신 (나중에 분리해야함)
                savePerksJson(locale);
            }
        }

        const json_skill = nodeStorage.getItem(`skill_${locale[1]}.json`);
        if (json_skill === null) {
            saveSkillsJson(locale);
        } else {
            if (JSON.parse(json_skill).version !== v) {
                saveSkillsJson(locale);
            }
        }

        const json_item = nodeStorage.getItem(`item_${locale[1]}.json`);
        if (json_item === null) {
            saveItemsJson(cdn, v, locale);
        } else {
            if (JSON.parse(json_item).version !== v) {
                saveItemsJson(cdn, v, locale);
            }
        }

        const json_spell = nodeStorage.getItem(`spell_${locale[1]}.json`);
        if (json_spell === null) {
            saveSpellsJson(cdn, v, locale);
        } else {
            if (JSON.parse(json_spell).version !== v) {
                saveSpellsJson(cdn, v, locale);
            }
        }

        const json_perk = nodeStorage.getItem(`perk_${locale[1]}.json`);
        if (json_perk === null) {
            savePerksJson(locale);
        }
    }).catch((err) => {
        console.log("[ERR] ddragon realms", err);
    });
});

let champions = {};
// locales.forEach((locale) => {
//     let json = nodeStorage.getItem(`champion_${locale[1]}.json`);
//     json = JSON.parse(json);
//     i18nLocales[locale[1]]["champions"] = {};
//     for (const [key, value] of Object.entries(json.data)) {
//         i18nLocales[locale[1]]["champions"][value.key] = value.name;
//     }
//     fs.writeFile(`./assets/i18n/locales/${locale[1]}.json`, JSON.stringify(i18nLocales[locale[1]], null, 2), (err) => {
//         if (err) {
//             console.log(err);
//         }
//     });
//     champions[locale[1]] = json;
// });

module.exports = {
    champions: champions
};
