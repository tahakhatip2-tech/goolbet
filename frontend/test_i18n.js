import i18next from 'i18next';
import en from './src/locales/en.json' with { type: "json" };
import ar from './src/locales/ar.json' with { type: "json" };

const resources = {
  en,
  ar,
};

i18next.init({
  resources,
  lng: 'en',
  fallbackLng: 'ar',
});

console.log('Language:', i18next.language);
console.log('nav.home in EN:', i18next.t('nav.home'));
i18next.changeLanguage('ar');
console.log('Language:', i18next.language);
console.log('nav.home in AR:', i18next.t('nav.home'));
