import type { Language } from "../translations";

export interface TeamCopy {
  title: string;
  subtitle: string;
  invite: { cta: string; copied: string; hint: string; seatsFull: string; upgrade: string };
  owner: string;
  chooseRole: string;
  roleOf: (name: string) => string;
  stages: string;
  noStages: string;
  sales: (count: number, amount: string) => string;
  removeConfirm: (name: string) => string;
  remove: string;
  pendingRole: string;
  empty: string;
  join: {
    invitedTo: string;
    asAgent: string;
    invalid: string;
    name: string;
    namePlaceholder: string;
    email: string;
    password: string;
    submit: string;
    submitting: string;
  };
  subscription: {
    title: string;
    current: string;
    popular: string;
    free: string;
    perMonth: string;
    choose: (plan: string) => string;
    renew: (plan: string) => string;
    until: (date: string) => string;
    manualNote: string;
    payTitle: (plan: string) => string;
    method: string;
    close: string;
    sendTo: (amount: string) => string;
    holder: string;
    notConfigured: string;
    afterPaying: string;
    scan: (method: string) => string;
    reference: string;
    referencePlaceholder: string;
    confirm: string;
    sending: string;
    doneTitle: string;
    doneDesc: (plan: string) => string;
  };
}

const fr: TeamCopy = {
  title: "Équipe",
  subtitle: "Invitez vos agents et choisissez ce que chacun peut faire.",
  invite: { cta: "Inviter un agent (copier le lien)", copied: "Lien copié", hint: "Le lien d'invitation est valable 7 jours. Chaque agent reçoit son propre accès, limité à son rôle.", seatsFull: "Votre plan n'autorise pas de membre supplémentaire.", upgrade: "Voir les plans" },
  owner: "Propriétaire",
  chooseRole: "Choisir un rôle…",
  roleOf: (name) => `Rôle de ${name}`,
  stages: "Étapes autorisées",
  noStages: "Aucun rôle attribué : cet agent ne voit encore aucune commande.",
  sales: (count, amount) => `${count} vente${count > 1 ? "s" : ""} · ${amount}`,
  removeConfirm: (name) => `Retirer ${name} de l'équipe ?`,
  remove: "Retirer de l'équipe",
  pendingRole: "Rôle à définir",
  empty: "Votre équipe se limite à vous pour le moment.",
  join: {
    invitedTo: "Vous êtes invité(e) à rejoindre",
    asAgent: "comme agent sur CONVERZA",
    invalid: "Ce lien d'invitation n'est pas valable ou a expiré. Demandez-en un nouveau au responsable de la boutique.",
    name: "Votre nom",
    namePlaceholder: "Jean Baptiste",
    email: "E-mail",
    password: "Mot de passe",
    submit: "Rejoindre l'équipe",
    submitting: "Création du compte…",
  },
  subscription: {
    title: "Abonnement",
    current: "Plan actuel",
    popular: "Populaire",
    free: "Gratuit",
    perMonth: "/ mois",
    choose: (plan) => `Choisir ${plan}`,
    renew: (plan) => `Renouveler ${plan} pour un mois`,
    until: (date) => `Payé jusqu'au ${date}. Un renouvellement s'ajoute à cette date.`,
    manualNote: "Les paiements sont vérifiés à la main : le plan est activé après confirmation.",
    payTitle: (plan) => `Payer le plan ${plan}`,
    method: "Moyen de paiement",
    close: "Fermer",
    sendTo: (amount) => `Envoyez ${amount} sur :`,
    holder: "Titulaire",
    notConfigured: "Les coordonnées de paiement CONVERZA ne sont pas encore renseignées. Contactez l'équipe avant de payer.",
    afterPaying: "Après le paiement, indiquez la référence de la transaction ci-dessous.",
    scan: (method) => `Scannez avec votre téléphone pour payer sur ${method}`,
    reference: "Référence de la transaction",
    referencePlaceholder: "Ex. 8842xxxx",
    confirm: "Confirmer le paiement",
    sending: "Envoi…",
    doneTitle: "Nous avons reçu votre demande",
    doneDesc: (plan) => `Le plan ${plan} sera activé dès que le paiement sera vérifié. Merci !`,
  },
};

const ht: TeamCopy = {
  title: "Ekip",
  subtitle: "Envite ajan ou yo epi chwazi sa chak moun ka fè.",
  invite: { cta: "Envite yon ajan (kopye lyen an)", copied: "Lyen kopye", hint: "Lyen envitasyon an valab 7 jou. Chak ajan jwenn pwòp aksè li, limite ak ròl li.", seatsFull: "Plan ou an pa pèmèt plis manm.", upgrade: "Wè plan yo" },
  owner: "Pwopriyetè",
  chooseRole: "Chwazi yon ròl…",
  roleOf: (name) => `Ròl ${name}`,
  stages: "Etap li gen dwa",
  noStages: "Pa gen ròl ki bay : ajan sa a poko wè okenn kòmand.",
  sales: (count, amount) => `${count} vant · ${amount}`,
  removeConfirm: (name) => `Retire ${name} nan ekip la ?`,
  remove: "Retire nan ekip la",
  pendingRole: "Ròl pou defini",
  empty: "Se ou menm sèl nan ekip la pou kounye a.",
  join: {
    invitedTo: "Yo envite w rantre nan",
    asAgent: "kòm ajan sou CONVERZA",
    invalid: "Lyen envitasyon sa a pa valab oswa li ekspire. Mande responsab boutik la yon lòt.",
    name: "Non ou",
    namePlaceholder: "Jan Batis",
    email: "Imèl",
    password: "Modpas",
    submit: "Rantre nan ekip la",
    submitting: "N ap kreye kont lan…",
  },
  subscription: {
    title: "Abònman",
    current: "Plan aktyèl",
    popular: "Popilè",
    free: "Gratis",
    perMonth: "/ mwa",
    choose: (plan) => `Chwazi ${plan}`,
    renew: (plan) => `Renouvle ${plan} pou yon mwa`,
    until: (date) => `Peye jiska ${date}. Yon renouvèlman ajoute sou dat sa a.`,
    manualNote: "Pèman yo verifye alamen : plan an aktive apre konfimasyon.",
    payTitle: (plan) => `Peye plan ${plan}`,
    method: "Mwayen pèman",
    close: "Fèmen",
    sendTo: (amount) => `Voye ${amount} sou :`,
    holder: "Titilè",
    notConfigured: "Kowòdone pèman CONVERZA yo poko anrejistre. Kontakte ekip la anvan w peye.",
    afterPaying: "Apre w fin peye, mete referans tranzaksyon an anba a.",
    scan: (method) => `Skane ak telefòn ou pou peye sou ${method}`,
    reference: "Referans tranzaksyon an",
    referencePlaceholder: "Egz. 8842xxxx",
    confirm: "Konfime pèman an",
    sending: "N ap voye…",
    doneTitle: "Nou resevwa demann ou",
    doneDesc: (plan) => `Plan ${plan} ap aktive kou nou verifye pèman an. Mèsi !`,
  },
};

const en: TeamCopy = {
  title: "Team",
  subtitle: "Invite your agents and choose what each of them can do.",
  invite: { cta: "Invite an agent (copy link)", copied: "Link copied", hint: "The invitation link is valid for 7 days. Each agent gets their own access, limited to their role.", seatsFull: "Your plan does not allow another member.", upgrade: "See the plans" },
  owner: "Owner",
  chooseRole: "Choose a role…",
  roleOf: (name) => `${name}'s role`,
  stages: "Allowed stages",
  noStages: "No role assigned yet: this agent cannot see any order.",
  sales: (count, amount) => `${count} sale${count > 1 ? "s" : ""} · ${amount}`,
  removeConfirm: (name) => `Remove ${name} from the team?`,
  remove: "Remove from the team",
  pendingRole: "Role to set",
  empty: "You are the only member for now.",
  join: {
    invitedTo: "You are invited to join",
    asAgent: "as an agent on CONVERZA",
    invalid: "This invitation link is not valid or has expired. Ask the store owner for a new one.",
    name: "Your name",
    namePlaceholder: "Jean Baptiste",
    email: "Email",
    password: "Password",
    submit: "Join the team",
    submitting: "Creating your account…",
  },
  subscription: {
    title: "Subscription",
    current: "Current plan",
    popular: "Popular",
    free: "Free",
    perMonth: "/ month",
    choose: (plan) => `Choose ${plan}`,
    renew: (plan) => `Renew ${plan} for one month`,
    until: (date) => `Paid until ${date}. A renewal is added on top of that date.`,
    manualNote: "Payments are checked by hand: the plan is activated after confirmation.",
    payTitle: (plan) => `Pay for the ${plan} plan`,
    method: "Payment method",
    close: "Close",
    sendTo: (amount) => `Send ${amount} to:`,
    holder: "Account holder",
    notConfigured: "CONVERZA payment details are not set up yet. Contact the team before paying.",
    afterPaying: "After paying, enter the transaction reference below.",
    scan: (method) => `Scan with your phone to pay with ${method}`,
    reference: "Transaction reference",
    referencePlaceholder: "e.g. 8842xxxx",
    confirm: "Confirm payment",
    sending: "Sending…",
    doneTitle: "We received your request",
    doneDesc: (plan) => `The ${plan} plan will be activated once the payment is verified. Thank you!`,
  },
};

export const TEAM_COPY: Record<Language, TeamCopy> = { fr, ht, en };
