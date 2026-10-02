"use client";

import { useLanguage } from "@/components/LanguageContext";
import { landingCopy } from "@/lib/i18n/landing";

/**
 * La signature de la marque, dans la langue du visiteur.
 *
 * Elle était écrite en dur, en anglais, sur l'écran de connexion : un
 * marchand qui avait choisi le créole ou le français y lisait une ligne
 * anglaise, juste sous le sélecteur de langue. La signature vient désormais
 * du même dictionnaire que le pied de page, pour que les deux ne puissent
 * plus diverger.
 *
 * `variante` choisit laquelle des trois signatures : la promesse part avec le
 * logo, la philosophie explique pourquoi la marque existe, l'action décrit ce
 * que la plateforme fait. Une seule a le droit d'accompagner le logo.
 */
export function Slogan({
  variante = "slogan",
  className = "",
}: {
  variante?: "slogan" | "philosophie" | "action";
  className?: string;
}) {
  const { language } = useLanguage();
  const footer = landingCopy(language).footer;
  return <span className={className}>{footer[variante]}</span>;
}
