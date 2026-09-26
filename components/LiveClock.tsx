"use client";

import { useEffect, useState } from "react";
import { useDict } from "@/components/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/i18n/app/dashboard";

/**
 * Date et heure du marchand, qui avancent toutes les secondes.
 *
 * L'heure vient de l'appareil, pas du serveur : c'est celle que le marchand
 * lit sur son téléphone, celle qu'il inscrit sur un reçu, celle dont il se
 * sert pour dire à un client « je ferme dans une heure ». Une heure serveur,
 * même juste, aurait été fausse pour lui.
 *
 * Rien n'est rendu tant que le composant n'a pas été monté dans le navigateur.
 * Le serveur et le navigateur ne peuvent pas tomber sur la même seconde : en
 * affichant une heure dès le premier rendu, React signalerait un écart
 * d'hydratation et remplacerait l'arbre entier. On garde la place, et la
 * première seconde s'inscrit aussitôt après.
 */
export function LiveClock({ className = "" }: { className?: string }) {
  const d = useDict(DASHBOARD_COPY);
  const [maintenant, setMaintenant] = useState<Date | null>(null);

  useEffect(() => {
    setMaintenant(new Date());

    // On se recale sur la seconde pleine avant de battre la seconde : sinon
    // l'affichage saute une seconde de temps en temps, selon l'instant où la
    // page a été ouverte.
    let battement: ReturnType<typeof setInterval> | null = null;
    const amorce = setTimeout(
      () => {
        setMaintenant(new Date());
        battement = setInterval(() => setMaintenant(new Date()), 1000);
      },
      1000 - (Date.now() % 1000),
    );

    return () => {
      clearTimeout(amorce);
      if (battement) clearInterval(battement);
    };
  }, []);

  const k = d.clock;
  const date = maintenant
    ? k.date({
        weekday: k.weekdays[maintenant.getDay()],
        day: maintenant.getDate(),
        month: k.months[maintenant.getMonth()],
        year: maintenant.getFullYear(),
      })
    : "";
  const heure = maintenant
    ? k.time({ h: maintenant.getHours(), m: maintenant.getMinutes(), s: maintenant.getSeconds() })
    : "";

  return (
    <div className={`flex items-baseline gap-1.5 ${className}`} suppressHydrationWarning>
      {/* La date se laisse couper sur un écran étroit, l'heure jamais :
          c'est elle qu'on vient lire. */}
      <span className="truncate first-letter:uppercase">{date || " "}</span>
      <span className="shrink-0 font-bold tabular-nums">{heure}</span>
    </div>
  );
}
