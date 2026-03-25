import { createContext, useState, useContext } from 'react';
import en from '../translations/en.json';
import es from '../translations/es.json';
import hi from '../translations/hi.json'
import kn from '../translations/kn.json'
import fr from '../translations/fr.json'
import ta from '../translations/ta.json'
import ml from '../translations/ml.json'
import ja from '../translations/ja.json'
import ar from '../translations/ar.json'

// Add other languages here if needed
const translations = { en, es, hi, kn, fr, ta, ml, ja, ar };

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en'); // Default to English

    // The 't' function: give it a key (e.g., 'start_analysis'), returns the translated string
    const t = (key) => {
        return translations[language][key] || key;
    };

    // Helper to get the full dictionary (useful for debugging or specific lookups)
    const getCurrentDictionary = () => translations[language];

    const value = {
        language,
        setLanguage,
        t,
        getCurrentDictionary
    };

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};