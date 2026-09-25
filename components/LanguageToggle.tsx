"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/components/LanguageContext";
import { LANGUAGE_OPTIONS, type Language } from "@/lib/i18n/translations";

// Icônes de drapeaux vectoriels SVG haute résolution (rendu identique sur Windows, Mac, iOS, Android)
export function FlagFR({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={`rounded-full shrink-0 shadow-2xs ${className}`} viewBox="0 0 512 512">
      <path fill="#00267f" d="M0 0h170.7v512H0z" />
      <path fill="#ffffff" d="M170.7 0h170.6v512H170.7z" />
      <path fill="#f31830" d="M341.3 0H512v512H341.3z" />
    </svg>
  );
}

export function FlagHT({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={`rounded-full shrink-0 shadow-2xs ${className}`} viewBox="0 0 512 512">
      <path fill="#00209f" d="M0 0h512v256H0z" />
      <path fill="#d21034" d="M0 256h512v256H0z" />
      <rect x="192" y="192" width="128" height="128" rx="10" fill="#ffffff" stroke="#d21034" strokeWidth="4" />
      <path fill="#008069" d="M256 210c-12 15-18 35-18 55h36c0-20-6-40-18-55z" />
      <path fill="#eab308" d="M253 265h6v30h-6z" />
    </svg>
  );
}

export function FlagEN({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={`rounded-full shrink-0 shadow-2xs ${className}`} viewBox="0 0 512 512">
      <path fill="#b22234" d="M0 0h512v512H0z" />
      <path fill="#ffffff" d="M0 39.4h512v39.4H0zm0 78.8h512v39.4H0zm0 78.8h512v39.4H0zm0 78.8h512v39.4H0zm0 78.8h512v39.4H0zm0 78.8h512v39.4H0z" />
      <path fill="#3c3b6e" d="M0 0h256v275.7H0z" />
      <circle cx="64" cy="64" r="14" fill="#ffffff" />
      <circle cx="128" cy="64" r="14" fill="#ffffff" />
      <circle cx="192" cy="64" r="14" fill="#ffffff" />
      <circle cx="96" cy="128" r="14" fill="#ffffff" />
      <circle cx="160" cy="128" r="14" fill="#ffffff" />
      <circle cx="64" cy="192" r="14" fill="#ffffff" />
      <circle cx="128" cy="192" r="14" fill="#ffffff" />
      <circle cx="192" cy="192" r="14" fill="#ffffff" />
    </svg>
  );
}

export function getFlagIcon(code: Language, className = "w-5 h-5") {
  switch (code) {
    case "fr":
      return <FlagFR className={className} />;
    case "ht":
      return <FlagHT className={className} />;
    case "en":
      return <FlagEN className={className} />;
    default:
      return <FlagFR className={className} />;
  }
}

interface LanguageToggleProps {
  variant?: "compact" | "full";
  className?: string;
}

export function LanguageToggle({ variant = "compact", className = "" }: LanguageToggleProps) {
  const { language, setLanguage, currentOption } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 items-center gap-1.5 rounded-xl border border-line bg-white px-2 py-1 text-xs font-bold text-ink shadow-2xs backdrop-blur-xs transition-all hover:bg-gray-50 active:scale-95 cursor-pointer"
        aria-label="Changer de langue"
      >
        {getFlagIcon(language, "w-5 h-5")}
        {variant === "full" && (
          <span className="font-extrabold tracking-wide text-ink">
            {currentOption.name}
          </span>
        )}
        <svg
          className={`h-3 w-3 text-ink-muted transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 w-36 rounded-2xl border border-line bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
          <div className="flex flex-col gap-0.5">
            {LANGUAGE_OPTIONS.map((opt) => {
              const isSelected = opt.code === language;
              return (
                <button
                  key={opt.code}
                  onClick={() => {
                    setLanguage(opt.code);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-50 text-brand font-extrabold"
                      : "text-ink hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {getFlagIcon(opt.code, "w-4 h-4")}
                    <span>{opt.name}</span>
                  </div>
                  {isSelected && <span className="text-brand font-black">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
