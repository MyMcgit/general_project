import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.less'
import App from './App.tsx'
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import En from './locales/en-US.json'
import Zh from './locales/zh-CN.json'
// 国际化初始化
i18n.use(initReactI18next).init({
  resources: {
    en: { translation:En },
    zh: { translation: Zh}
  },
  lng: 'zh', // 当前语言
  fallbackLng: 'en', // 备用语言
  interpolation: { escapeValue: false } 
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
