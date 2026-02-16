import { useLanguage } from '../context/LanguageContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineBanner = () => {
  const isOnline = useOnlineStatus();
  const { t } = useLanguage();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-900/95 text-white text-center py-3 px-4 animate-in slide-in-from-top">
      <div className="flex items-center justify-center gap-2">
        <WifiOff size={14} className="flex-shrink-0" />
        <p className="text-xs uppercase tracking-widest font-bold">
          {t.polish.offlineBanner}
        </p>
      </div>
    </div>
  );
};
