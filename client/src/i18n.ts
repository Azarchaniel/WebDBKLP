import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import cs from "./locales/cs.json";
import sk from "./locales/sk.json";

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            cs: { translation: cs },
            sk: { translation: sk }
        },
        fallbackLng: "sk",
        supportedLngs: ["sk", "cs", "en"],
        interpolation: {
            escapeValue: false
        },
        detection: {
            order: ["localStorage", "navigator"],
            caches: ["localStorage"],
            lookupLocalStorage: "i18nLang"
        },
        saveMissing: true,
        missingKeyHandler: function (lng, ns, key) {
            console.warn(`Missing translation for key: ${key} in language: ${lng} and namespace: ${ns}`);
        }
    });

export default i18n;
