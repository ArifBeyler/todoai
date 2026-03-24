import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import tr from "./locales/tr.json";
i18n.use(initReactI18next).init({ compatibilityJSON: "v4", lng: "tr", fallbackLng: "en", resources: { tr: { translation: tr }, en: { translation: en } }, interpolation: { escapeValue: false } });
export default i18n;
