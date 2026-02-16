import { useLanguage } from '../context/LanguageContext';

export const PageLoader = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <img
          src="/GoldTripleJLogo.png"
          alt="Triple J Auto Investment"
          className="w-16 h-16 mx-auto animate-pulse mb-4"
        />
        <p className="text-gray-400 text-xs uppercase tracking-widest">
          {t.common.loading}
        </p>
      </div>
    </div>
  );
};
