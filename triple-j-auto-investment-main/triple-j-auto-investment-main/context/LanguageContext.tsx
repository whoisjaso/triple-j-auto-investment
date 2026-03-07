import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { t, Language } from '../utils/translations';

interface LanguageContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    toggleLang: () => void;
    t: typeof t['en'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [lang, setLangState] = useState<Language>('en');

    useEffect(() => {
        const savedLang = localStorage.getItem('tj_lang') as Language;
        if (savedLang && (savedLang === 'en' || savedLang === 'es')) {
            setLangState(savedLang);
            return;
        }
        // Auto-detect from browser language for first-time visitors
        const browserLang = navigator.language || (navigator.languages && navigator.languages[0]) || 'en';
        if (browserLang.startsWith('es')) {
            setLangState('es');
            localStorage.setItem('tj_lang', 'es');
        }
        // English is default -- no action needed for non-Spanish browsers
    }, []);

    const setLang = (newLang: Language) => {
        setLangState(newLang);
        localStorage.setItem('tj_lang', newLang);
    };

    const toggleLang = () => {
        setLang(lang === 'en' ? 'es' : 'en');
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang, toggleLang, t: t[lang] }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
