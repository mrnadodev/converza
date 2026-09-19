import type { Language } from "../translations";
import type { PhoneChangeError } from "@/app/chanje-nimewo/actions";

// Écran « Changer de numéro WhatsApp » du marchand.

export interface PhoneCopy {
  title: string;
  subtitle: string;
  intro: string;
  current: string;
  none: string;
  steps: string[];
  form: {
    title: string;
    newPhone: string;
    newPhoneHint: string;
    reason: string;
    reasons: { piratage: string; perte: string; autre: string };
    note: string;
    notePlaceholder: string;
    notice: string;
    noticeHint: string;
    noticeDays: (n: number) => string;
    proofs: string;
    proofsHint: string;
    idDoc: string;
    idDocHint: string;
    addFile: string;
    remove: string;
    uploading: string;
    privacy: string;
    privacyLink: string;
    submit: string;
    submitting: string;
  };
  errors: Record<PhoneChangeError, string>;
  pending: {
    title: string;
    body: (date: string) => string;
    to: string;
    cancel: string;
    cancelConfirm: string;
  };
  rejected: { title: string; body: string; reason: string };
  approved: {
    title: string;
    body: (date: string) => string;
    bannerUntil: (date: string) => string;
    bannerOff: string;
    hide: string;
  };
  notify: {
    title: string;
    hint: string;
    language: string;
    progress: (done: number, total: number) => string;
    send: string;
    sent: string;
    empty: string;
    message: (customer: string, shop: string, phone: string, link: string) => string;
  };
  history: { title: string; status: Record<"pending" | "approved" | "rejected" | "cancelled", string> };
  ownerOnly: string;
}

export const PHONE_COPY: Record<Language, PhoneCopy> = {
  fr: {
    title: "Changer de numéro WhatsApp",
    subtitle: "Votre clientèle reste avec vous",
    intro:
      "Compte piraté, téléphone perdu ou nouvelle puce : vos clients, votre vitrine et vos commandes sont chez CONVERZA, pas dans WhatsApp. Une fois votre demande validée, votre vitrine envoie les clients vers le nouveau numéro, et vous pouvez les prévenir un par un.",
    current: "Numéro actuel",
    none: "Aucun",
    steps: [
      "Vous envoyez le nouveau numéro, une preuve et votre pièce d'identité.",
      "CONVERZA vérifie que la demande vient bien de vous, en général sous 24 h.",
      "La vitrine bascule sur le nouveau numéro ; vos documents sont supprimés.",
    ],
    form: {
      title: "Nouvelle demande",
      newPhone: "Nouveau numéro WhatsApp",
      newPhoneHint: "Numéro haïtien à 8 chiffres, ou numéro complet avec l'indicatif.",
      reason: "Motif",
      reasons: { piratage: "Mon compte WhatsApp a été piraté", perte: "Téléphone ou puce perdu(e)", autre: "Autre raison" },
      note: "Précisions (facultatif)",
      notePlaceholder: "Depuis quand, ce qui s'est passé…",
      notice: "Bandeau sur la vitrine",
      noticeHint: "Un message neutre annonce le nouveau numéro. Ensuite, une petite mention reste jusqu'à 30 jours.",
      noticeDays: (n) => `${n} jours`,
      proofs: "Preuves",
      proofsHint: "Captures d'écran : message de WhatsApp, compte inaccessible, signalement… Obligatoire en cas de piratage.",
      idDoc: "Pièce d'identité",
      idDocHint: "CIN, passeport ou permis, au nom du propriétaire de la boutique.",
      addFile: "Ajouter un fichier",
      remove: "Retirer",
      uploading: "Envoi…",
      privacy: "Vos documents sont stockés dans un espace privé, vus uniquement par l'équipe CONVERZA, et supprimés dès la décision prise.",
      privacyLink: "Lire la politique de confidentialité",
      submit: "Envoyer la demande",
      submitting: "Envoi de la demande…",
    },
    errors: {
      notOwner: "Seul le propriétaire de la boutique peut changer le numéro.",
      noService: "Service indisponible pour le moment. Réessayez plus tard.",
      invalidPhone: "Ce numéro n'est pas valide.",
      samePhone: "C'est déjà le numéro de votre boutique.",
      alreadyPending: "Une demande est déjà en cours.",
      missingId: "Ajoutez votre pièce d'identité.",
      missingProof: "Ajoutez au moins une preuve du piratage.",
      badFile: "Fichier non accepté : image (JPG, PNG, WebP) ou PDF, 8 Mo maximum.",
      failed: "L'envoi a échoué. Réessayez.",
    },
    pending: {
      title: "Demande en cours de vérification",
      body: (date) => `Envoyée le ${date}. Vous serez fixé en général sous 24 h.`,
      to: "Nouveau numéro demandé",
      cancel: "Annuler la demande",
      cancelConfirm: "Annuler la demande ? Vos documents seront supprimés.",
    },
    rejected: {
      title: "Dernière demande refusée",
      body: "Vous pouvez en envoyer une nouvelle avec des documents plus lisibles.",
      reason: "Motif",
    },
    approved: {
      title: "Numéro changé",
      body: (date) => `Votre vitrine utilise le nouveau numéro depuis le ${date}.`,
      bannerUntil: (date) => `Le bandeau est affiché sur la vitrine jusqu'au ${date}.`,
      bannerOff: "Le bandeau n'est plus affiché ; une petite mention reste sur la vitrine.",
      hide: "Retirer le bandeau maintenant",
    },
    notify: {
      title: "Prévenir mes clients",
      hint: "Ouvrez WhatsApp avec le nouveau numéro, puis envoyez le message à chaque client. Il est déjà rédigé.",
      language: "Langue du message",
      progress: (done, total) => `${done} / ${total} prévenus`,
      send: "Envoyer",
      sent: "Envoyé",
      empty: "Aucun client enregistré pour l'instant.",
      message: (customer, shop, phone, link) =>
        `Bonjour ${customer}, ici ${shop}. Notre numéro WhatsApp a changé : écrivez-nous désormais au ${phone}. L'ancien numéro n'est plus utilisé, n'y envoyez ni commande ni paiement. Notre boutique : ${link}`,
    },
    history: {
      title: "Historique",
      status: { pending: "En cours", approved: "Validée", rejected: "Refusée", cancelled: "Annulée" },
    },
    ownerOnly: "Seul le propriétaire de la boutique peut changer le numéro WhatsApp.",
  },
  ht: {
    title: "Chanje nimewo WhatsApp",
    subtitle: "Kliyan ou yo rete avè w",
    intro:
      "Kont pirate, telefòn pèdi oswa nouvo chip : kliyan ou yo, vitrin ou ak kòmand ou yo nan CONVERZA, yo pa nan WhatsApp. Lè nou valide demann nan, vitrin ou voye kliyan yo sou nouvo nimewo a, epi ou ka avèti yo youn apre lòt.",
    current: "Nimewo kounye a",
    none: "Okenn",
    steps: [
      "Ou voye nouvo nimewo a, yon prèv ak pyès idantite w.",
      "CONVERZA verifye se ou menm ki fè demann nan, jeneralman nan 24 è.",
      "Vitrin nan pase sou nouvo nimewo a ; dokiman ou yo efase.",
    ],
    form: {
      title: "Nouvo demann",
      newPhone: "Nouvo nimewo WhatsApp",
      newPhoneHint: "Nimewo ayisyen 8 chif, oswa nimewo konplè ak kòd peyi a.",
      reason: "Rezon",
      reasons: { piratage: "Yo pirate kont WhatsApp mwen", perte: "Telefòn oswa chip pèdi", autre: "Lòt rezon" },
      note: "Plis detay (si w vle)",
      notePlaceholder: "Depi kilè, sa k te pase…",
      notice: "Bandwòl sou vitrin nan",
      noticeHint: "Yon mesaj trankil anonse nouvo nimewo a. Apre sa, yon ti mansyon rete jiska 30 jou.",
      noticeDays: (n) => `${n} jou`,
      proofs: "Prèv",
      proofsHint: "Foto ekran : mesaj WhatsApp, kont ou pa ka louvri, siyalman… Obligatwa si se piratay.",
      idDoc: "Pyès idantite",
      idDocHint: "CIN, paspò oswa lisans, sou non mèt boutik la.",
      addFile: "Ajoute yon fichye",
      remove: "Retire",
      uploading: "N ap voye…",
      privacy: "Dokiman ou yo nan yon espas prive, se ekip CONVERZA sèlman ki wè yo, epi yo efase lè desizyon an pran.",
      privacyLink: "Li politik konfidansyalite a",
      submit: "Voye demann nan",
      submitting: "N ap voye demann nan…",
    },
    errors: {
      notOwner: "Se sèlman mèt boutik la ki ka chanje nimewo a.",
      noService: "Sèvis la pa disponib kounye a. Eseye pita.",
      invalidPhone: "Nimewo sa a pa bon.",
      samePhone: "Se deja nimewo boutik ou.",
      alreadyPending: "Gen yon demann k ap trete deja.",
      missingId: "Ajoute pyès idantite w.",
      missingProof: "Ajoute omwen yon prèv piratay la.",
      badFile: "Fichye sa pa pase : imaj (JPG, PNG, WebP) oswa PDF, 8 Mo maksimòm.",
      failed: "Voye a pa mache. Eseye ankò.",
    },
    pending: {
      title: "N ap verifye demann nan",
      body: (date) => `Voye le ${date}. Jeneralman w ap gen repons nan 24 è.`,
      to: "Nouvo nimewo ou mande a",
      cancel: "Anile demann nan",
      cancelConfirm: "Anile demann nan ? Dokiman ou yo ap efase.",
    },
    rejected: {
      title: "Dènye demann nan refize",
      body: "Ou ka voye yon lòt ak dokiman ki pi klè.",
      reason: "Rezon",
    },
    approved: {
      title: "Nimewo a chanje",
      body: (date) => `Vitrin ou sèvi ak nouvo nimewo a depi ${date}.`,
      bannerUntil: (date) => `Bandwòl la parèt sou vitrin nan jiska ${date}.`,
      bannerOff: "Bandwòl la pa parèt ankò ; yon ti mansyon rete sou vitrin nan.",
      hide: "Retire bandwòl la kounye a",
    },
    notify: {
      title: "Avèti kliyan m yo",
      hint: "Louvri WhatsApp ak nouvo nimewo a, epi voye mesaj la bay chak kliyan. Li deja ekri.",
      language: "Lang mesaj la",
      progress: (done, total) => `${done} / ${total} avèti`,
      send: "Voye",
      sent: "Voye",
      empty: "Poko gen kliyan anrejistre.",
      message: (customer, shop, phone, link) =>
        `Bonjou ${customer}, se ${shop}. Nimewo WhatsApp nou an chanje : kounye a, ekri nou nan ${phone}. Nou pa sèvi ak ansyen nimewo a ankò, pa voye ni kòmand ni lajan ladan l. Boutik nou : ${link}`,
    },
    history: {
      title: "Istorik",
      status: { pending: "Ap trete", approved: "Valide", rejected: "Refize", cancelled: "Anile" },
    },
    ownerOnly: "Se sèlman mèt boutik la ki ka chanje nimewo WhatsApp la.",
  },
  en: {
    title: "Change WhatsApp number",
    subtitle: "Your customers stay with you",
    intro:
      "Hacked account, lost phone or new SIM: your customers, storefront and orders live in CONVERZA, not in WhatsApp. Once your request is approved, your storefront sends customers to the new number, and you can notify them one by one.",
    current: "Current number",
    none: "None",
    steps: [
      "You send the new number, a proof and your ID.",
      "CONVERZA checks the request really comes from you, usually within 24 h.",
      "The storefront switches to the new number; your documents are deleted.",
    ],
    form: {
      title: "New request",
      newPhone: "New WhatsApp number",
      newPhoneHint: "8-digit Haitian number, or full number with country code.",
      reason: "Reason",
      reasons: { piratage: "My WhatsApp account was hacked", perte: "Lost phone or SIM", autre: "Other reason" },
      note: "Details (optional)",
      notePlaceholder: "Since when, what happened…",
      notice: "Storefront banner",
      noticeHint: "A neutral message announces the new number. Afterwards, a small note stays for up to 30 days.",
      noticeDays: (n) => `${n} days`,
      proofs: "Proof",
      proofsHint: "Screenshots: WhatsApp message, locked account, report… Required for a hacked account.",
      idDoc: "ID document",
      idDocHint: "National ID, passport or driver's license, in the shop owner's name.",
      addFile: "Add a file",
      remove: "Remove",
      uploading: "Uploading…",
      privacy: "Your documents are kept in a private space, seen only by the CONVERZA team, and deleted as soon as a decision is made.",
      privacyLink: "Read the privacy policy",
      submit: "Send request",
      submitting: "Sending request…",
    },
    errors: {
      notOwner: "Only the shop owner can change the number.",
      noService: "Service unavailable right now. Try again later.",
      invalidPhone: "This number is not valid.",
      samePhone: "This is already your shop's number.",
      alreadyPending: "A request is already in progress.",
      missingId: "Add your ID document.",
      missingProof: "Add at least one proof of the hack.",
      badFile: "File not accepted: image (JPG, PNG, WebP) or PDF, 8 MB max.",
      failed: "Sending failed. Try again.",
    },
    pending: {
      title: "Request under review",
      body: (date) => `Sent on ${date}. You'll usually hear back within 24 h.`,
      to: "Requested new number",
      cancel: "Cancel request",
      cancelConfirm: "Cancel the request? Your documents will be deleted.",
    },
    rejected: {
      title: "Last request declined",
      body: "You can send a new one with clearer documents.",
      reason: "Reason",
    },
    approved: {
      title: "Number changed",
      body: (date) => `Your storefront has used the new number since ${date}.`,
      bannerUntil: (date) => `The banner shows on your storefront until ${date}.`,
      bannerOff: "The banner is no longer shown; a small note stays on your storefront.",
      hide: "Remove the banner now",
    },
    notify: {
      title: "Notify my customers",
      hint: "Open WhatsApp with the new number, then send the message to each customer. It's already written.",
      language: "Message language",
      progress: (done, total) => `${done} / ${total} notified`,
      send: "Send",
      sent: "Sent",
      empty: "No saved customers yet.",
      message: (customer, shop, phone, link) =>
        `Hello ${customer}, this is ${shop}. Our WhatsApp number has changed: please message us at ${phone} from now on. The old number is no longer used, so don't send orders or payments to it. Our shop: ${link}`,
    },
    history: {
      title: "History",
      status: { pending: "In progress", approved: "Approved", rejected: "Declined", cancelled: "Cancelled" },
    },
    ownerOnly: "Only the shop owner can change the WhatsApp number.",
  },
};
