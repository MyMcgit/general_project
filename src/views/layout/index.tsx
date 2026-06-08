import { useTranslation } from 'react-i18next';

export default function Layout() {
  const { t, i18n } = useTranslation();

  const changeLanguage = () => {
    i18n.changeLanguage(i18n.language === 'zh' ? 'en' : 'zh');
  };

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>{t('user.greeting', { name: 'Alice' })}</p>
      <p>{t('notify', { count: 5 })}</p>
      <button onClick={changeLanguage}>
        切换语言
      </button>
    </div>
  );
}