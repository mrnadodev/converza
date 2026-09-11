import { NewPasswordForm } from "@/components/NewPasswordForm";

// Cible du lien de réinitialisation envoyé par e-mail.
// Supabase place le jeton de récupération dans le fragment de l'URL ; le client
// navigateur l'échange contre une session, puis le formulaire enregistre le
// nouveau mot de passe.
export default function NouvoModpasPage() {
  return <NewPasswordForm />;
}
