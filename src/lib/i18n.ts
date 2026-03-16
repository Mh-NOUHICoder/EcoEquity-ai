"use client";

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { translations } from './translations';

const isClient = typeof window !== 'undefined';

// Add plugins
i18n.use(initReactI18next);

if (isClient) {
  i18n.use(LanguageDetector);
}

// Initialize
i18n.init({
  resources: Object.keys(translations).reduce((acc, lang) => {
    acc[lang] = { translation: translations[lang as keyof typeof translations] };
    return acc;
  }, {} as any),
  lng: 'en', // Default to en for SSR consistency
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  detection: {
    order: ['localStorage', 'navigator'],
    caches: ['localStorage'],
  },
  react: {
    useSuspense: false, // Avoid suspense issues during hydration if not wrapped
  }
});

export default i18n;
