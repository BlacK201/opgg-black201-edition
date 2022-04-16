import en from "../../assets/i18n/locales/en.json";
import kr from "../../assets/i18n/locales/kr.json";
import de from "../../assets/i18n/locales/de.json";
import es from "../../assets/i18n/locales/es.json";
import fr from "../../assets/i18n/locales/fr.json";
import ja from "../../assets/i18n/locales/ja.json";
import pl from "../../assets/i18n/locales/pl.json";
import pt from "../../assets/i18n/locales/pt.json";
import ru from "../../assets/i18n/locales/ru.json";
import sc from "../../assets/i18n/locales/sc.json";
import tc from "../../assets/i18n/locales/tc.json";
import tr from "../../assets/i18n/locales/tr.json";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
// const osLocale = globalThis.require('os-locale');
// const { ipcRenderer } = globalThis.require('electron');

// the translations
// (tip move them in a JSON file and import them)
const resources = {
    kr: {
        translation: kr
    },
    en: {
        translation: en
    },
    de: {
        translation: de
    },
    es: {
        translation: es
    },
    fr: {
        translation: fr
    },
    ja: {
        translation: ja
    },
    pl: {
        translation: pl
    },
    pt: {
        translation: pt
    },
    ru: {
        translation: ru
    },
    sc: {
        translation: sc
    },
    tc: {
        translation: tc
    },
    tr: {
        translation: tr
    },
};

let i18nLang = "en";
export default (async () => {
    let osLanguage = localStorage.getItem("i18n") ?? "";
    if (osLanguage === "") {
        osLanguage = window.api.osLocale();
        if (osLanguage === "ko-KR") {
            osLanguage = "kr";
        } else {
            osLanguage = "en";
        }
    }
    i18nLang = osLanguage;
    await i18n
        .use(initReactI18next) // passes i18n down to react-i18next
        .init({
            resources: resources,
            lng: i18nLang,
            debug: true,
            fallbackLng: "en",
            keySeparator: ".", // we do not use keys in form messages.welcome
            initImmediate: false,
            interpolation: {
                escapeValue: false, // react already safes from xss
            },
        }, () => {
            localStorage.setItem("i18n", i18nLang);
            window.api.send("i18n-changed", i18nLang);
        });
    return i18n;
})();