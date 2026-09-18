"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  type Language,
  type LanguageOption,
  LANGUAGE_OPTIONS,
  translations,
} from "@/lib/i18n/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currentOption: LanguageOption;
  t: <S extends keyof typeof translations.fr, K extends keyof (typeof translations.fr)[S]>(
    section: S,
    key: K
  ) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "converza_lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Par défaut Français ("fr") comme demandé
  const [language, setLanguageState] = useState<Language>("fr");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved && (saved === "fr" || saved === "ht" || saved === "en")) {
        setLanguageState(saved);
      }
    } catch {
      // Ignorer l'erreur de localStorage si indisponible
    } finally {
      setMounted(true);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Ignorer
    }
  };

  const currentOption =
    LANGUAGE_OPTIONS.find((opt) => opt.code === language) ?? LANGUAGE_OPTIONS[0];

  const t = <
    S extends keyof typeof translations.fr,
    K extends keyof (typeof translations.fr)[S]
  >(
    section: S,
    key: K
  ): string => {
    const dict = translations[language] || translations.fr;
    const secObj = dict[section] || translations.fr[section];
    if (secObj && key in secObj) {
      return secObj[key as keyof typeof secObj] as string;
    }
    // Fallback sur le français
    const fallbackSec = translations.fr[section];
    if (fallbackSec && key in fallbackSec) {
      return fallbackSec[key as keyof typeof fallbackSec] as string;
    }
    return String(key);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        currentOption,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Retomber sur un fallback sécurisé au cas où il est appelé en dehors du provider
    const defaultOption = LANGUAGE_OPTIONS[0];
    return {
      language: "fr" as Language,
      setLanguage: () => {},
      currentOption: defaultOption,
      t: <S extends keyof typeof translations.fr, K extends keyof (typeof translations.fr)[S]>(
        section: S,
        key: K
      ) => {
        const secObj = translations.fr[section];
        if (secObj && key in secObj) {
          return secObj[key as keyof typeof secObj] as string;
        }
        return String(key);
      },
    };
  }
  return context;
}

export function useTranslation() {
  return useLanguage();
}

/** Sélectionne la version d'un dictionnaire d'écran dans la langue active. */
export function useDict<T>(dict: Record<Language, T>): T {
  const { language } = useLanguage();
  return dict[language] ?? dict.fr;
}
