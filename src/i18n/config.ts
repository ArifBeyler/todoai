import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import tr from "./locales/tr.json";

export const SUPPORTED_LANGUAGES = [
  { code: "tr", label: "Türkçe", nativeLabel: "Türkçe" },
  { code: "en", label: "English", nativeLabel: "English" },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]["code"];

i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  lng: "tr",
  fallbackLng: "en",
  resources: {
    tr: { translation: tr },
    en: { translation: en },
  },
  interpolation: { escapeValue: false },
  defaultNS: "translation",
  ns: ["translation"],
});

export const changeLanguage = async (lang: SupportedLanguage) => {
  await i18n.changeLanguage(lang);
};

export const getCurrentLanguage = (): SupportedLanguage =>
  (i18n.language as SupportedLanguage) ?? "tr";

export default i18n;
