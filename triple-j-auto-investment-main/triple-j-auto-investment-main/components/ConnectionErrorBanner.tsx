import { useStore } from '../context/Store';
import { useLanguage } from '../context/LanguageContext';
import { AlertTriangle } from 'lucide-react';

export const ConnectionErrorBanner = () => {
  const { connectionError } = useStore();
  const { t } = useLanguage();

  if (!connectionError) return null;

  return (
    <div className="mx-4 md:mx-6 mb-4 bg-amber-900/20 border border-amber-500/30 p-4 md:p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-amber-200 text-sm">
            {t.polish.connectionError}
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <button
              onClick={() => window.location.reload()}
              className="text-xs uppercase tracking-widest text-amber-400 hover:text-white transition-colors font-bold"
            >
              {t.polish.connectionRetry}
            </button>
            <a
              href="tel:+18324009760"
              className="text-xs uppercase tracking-widest text-amber-400 hover:text-white transition-colors"
            >
              {t.polish.connectionCallUs}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
