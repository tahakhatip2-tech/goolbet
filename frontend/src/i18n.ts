import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './locales/en.json';
import translationAR from './locales/ar.json';

const SUPPORTED_LANGS = ['ar', 'en'];

const rawLang = localStorage.getItem('lang') || 'ar';
const savedLang = SUPPORTED_LANGS.includes(rawLang) ? rawLang : 'ar';

const resources = {
  en: translationEN,
  ar: translationAR,
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false,
    },
  });

function applyLanguage(lng: string) {
  const isAr = lng === 'ar';
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
  localStorage.setItem('lang', lng);

  // Switch font: Tajawal for Arabic, Inter for English
  const existing = document.getElementById('app-font-link');
  if (existing) existing.remove();
  const link = document.createElement('link');
  link.id = 'app-font-link';
  link.rel = 'stylesheet';
  link.href = isAr
    ? 'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap'
    : 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
  document.head.appendChild(link);

  document.body.style.fontFamily = isAr
    ? "'Tajawal', sans-serif"
    : "'Inter', sans-serif";
}

i18n.on('languageChanged', applyLanguage);

// Apply on init
applyLanguage(savedLang);

export default i18n;
