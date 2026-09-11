"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CvzMark } from "@/components/CvzMark";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/components/LanguageContext";
import { landingCopy } from "@/lib/i18n/landing";

type State = "checking" | "ready" | "invalid" | "saving" | "done";

const TEXT = {
  fr: {
    title: "Nouveau mot de passe",
    subtitle: "Choisissez un mot de passe d'au moins 6 caractères.",
    checking: "Vérification du lien…",
    invalid: "Ce lien n'est plus valable. Demandez-en un nouveau depuis la page de connexion.",
    password: "Nouveau mot de passe",
    confirm: "Confirmez le mot de passe",
    save: "Enregistrer",
    saving: "Enregistrement…",
    done: "Mot de passe modifié. Vous pouvez vous connecter.",
    backToLogin: "Aller à la connexion",
    tooShort: "Le mot de passe doit faire au moins 6 caractères.",
    mismatch: "Les deux mots de passe ne correspondent pas.",
  },
  ht: {
    title: "Nouvo modpas",
    subtitle: "Chwazi yon modpas ki gen omwen 6 karaktè.",
    checking: "N ap verifye lyen an…",
    invalid: "Lyen sa a pa valab ankò. Mande yon lòt sou paj koneksyon an.",
    password: "Nouvo modpas",
    confirm: "Konfime modpas la",
    save: "Anrejistre",
    saving: "N ap anrejistre…",
    done: "Modpas la chanje. Ou ka konekte kounye a.",
    backToLogin: "Ale nan koneksyon",
    tooShort: "Modpas la dwe gen omwen 6 karaktè.",
    mismatch: "De modpas yo pa menm.",
  },
  en: {
    title: "New password",
    subtitle: "Choose a password of at least 6 characters.",
    checking: "Checking the link…",
    invalid: "This link is no longer valid. Request a new one from the sign-in page.",
    password: "New password",
    confirm: "Confirm password",
    save: "Save",
    saving: "Saving…",
    done: "Password changed. You can sign in now.",
    backToLogin: "Go to sign in",
    tooShort: "The password must be at least 6 characters.",
    mismatch: "The two passwords do not match.",
  },
} as const;

export function NewPasswordForm() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = TEXT[language] ?? TEXT.fr;
  const a = landingCopy(language).auth;

  const [state, setState] = useState<State>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Le jeton de récupération arrive dans l'URL ; le client Supabase l'échange
  // contre une session au chargement. On attend d'avoir cette session avant
  // d'afficher le formulaire, sinon l'enregistrement échouerait.
  useEffect(() => {
    let cancelled = false;
    const sb = createClient();

    const check = async () => {
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (cancelled) return;
      setState(session ? "ready" : "invalid");
    };

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (session) setState((s) => (s === "checking" || s === "invalid" ? "ready" : s));
    });

    // Petit délai : l'échange du jeton se fait juste après le montage.
    const timer = setTimeout(check, 700);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, []);

  async function save() {
    setError(null);
    if (password.length < 6) return setError(t.tooShort);
    if (password !== confirm) return setError(t.mismatch);

    setState("saving");
    const sb = createClient();
    const { error: err } = await sb.auth.updateUser({ password });
    if (err) {
      setError(err.message);
      setState("ready");
      return;
    }
    setState("done");
    setTimeout(() => router.push("/login"), 2500);
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-chat-bg md:mx-auto md:my-10 md:min-h-0 md:max-w-[440px] md:overflow-hidden md:rounded-3xl md:shadow-xl">
      <div className="relative flex flex-col items-center gap-3 bg-brand px-6 pb-10 pt-14 text-center">
        <div className="absolute right-4 top-4"><LanguageToggle /></div>
        <CvzMark size={56} />
        <span className="text-xl font-extrabold tracking-tight text-white">{t.title}</span>
        <span className="text-[13px] text-[#B9F5E4]">{t.subtitle}</span>
      </div>

      <div className="-mt-6 flex-1 rounded-t-[28px] bg-white px-6 pb-10 pt-7">
        {state === "checking" && <p className="text-[14px] text-ink-muted">{t.checking}</p>}

        {state === "invalid" && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-[#FCE4E4] px-4 py-3 text-[13px] font-medium text-[#C0392B]">{t.invalid}</div>
            <Link href="/login" className="flex h-12 items-center justify-center rounded-2xl bg-brand text-sm font-extrabold text-white">
              {t.backToLogin}
            </Link>
          </div>
        )}

        {state === "done" && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-[#E7F7F1] px-4 py-3 text-[13px] font-medium text-[#0B6B57]">{t.done}</div>
            <Link href="/login" className="flex h-12 items-center justify-center rounded-2xl bg-brand text-sm font-extrabold text-white">
              {t.backToLogin}
            </Link>
          </div>
        )}

        {(state === "ready" || state === "saving") && (
          <div className="flex flex-col gap-4">
            {error && <div className="rounded-xl bg-[#FCE4E4] px-4 py-3 text-[13px] font-medium text-[#C0392B]">{error}</div>}
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-ink-soft">{t.password}</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                className="h-12 rounded-xl border border-line bg-[#F7F8F9] px-4 text-[15px] outline-none focus:border-brand focus:bg-white"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-ink-soft">{t.confirm}</span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                className="h-12 rounded-xl border border-line bg-[#F7F8F9] px-4 text-[15px] outline-none focus:border-brand focus:bg-white"
              />
            </label>
            <button
              onClick={save}
              disabled={state === "saving"}
              className="mt-2 flex h-[52px] items-center justify-center rounded-2xl bg-brand-green text-base font-extrabold text-white shadow-[0_6px_16px_rgba(37,211,102,0.4)] disabled:opacity-60"
            >
              {state === "saving" ? t.saving : t.save}
            </button>
            <p className="text-center text-[13px] text-ink-muted">
              <Link href="/login" className="font-bold text-brand">{a.signInLink}</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
