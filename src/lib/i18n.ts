"use client";

import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { translations } from './translations';

const isClient = typeof window !== 'undefined';

if (isClient) {
  // We import dynamically or use the standard import but only use it here
  // react-i18next uses createContext which breaks RSC pre-rendering
  const { initReactI18next } = require('react-i18next');

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: Object.keys(translations).reduce((acc, lang) => {
        acc[lang] = { translation: translations[lang as keyof typeof translations] };
        return acc;
      }, {} as any),
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      }
    });
}

export default i18n;
