import type { Language } from "./translations";
import type { LegalInfo } from "../legal";

// Conditions d'utilisation et politique de confidentialité.
//
// Chaque phrase décrit ce que le logiciel fait réellement : ce qui est public
// (la vitrine), ce qui ne l'est jamais (comptes de paiement, prix d'achat,
// clients), et combien de temps les pièces d'identité sont gardées. Si le code
// change, ces textes changent avec lui.

export interface LegalSection {
  title: string;
  body: string[];
}

export interface LegalCopy {
  back: string;
  updated: (date: string) => string;
  noDate: string;
  contactTitle: string;
  noContact: string;
  entityFallback: string;
  terms: { title: string; subtitle: string; sections: LegalSection[] };
  privacy: { title: string; subtitle: string; sections: LegalSection[] };
}

const fr: LegalCopy = {
  back: "Retour",
  updated: (d) => `Dernière mise à jour : ${d}`,
  noDate: "Document en vigueur à ce jour.",
  contactTitle: "Nous joindre",
  noContact:
    "Les coordonnées de contact ne sont pas encore publiées. En attendant, écris au commerçant chez qui tu as commandé, ou passe par la page d'aide de l'application.",
  entityFallback: "CONVERZA",
  terms: {
    title: "Conditions d'utilisation",
    subtitle: "Ce que CONVERZA fait, ce qu'elle ne fait pas, et ce que chacun s'engage à respecter.",
    sections: [
      {
        title: "1. Ce que fait CONVERZA",
        body: [
          "CONVERZA donne à un commerçant une vitrine à partager par un lien, un catalogue, et un suivi de ses commandes de la première demande jusqu'au paiement encaissé.",
          "Les conversations passent par WhatsApp, et l'argent passe par le moyen de paiement choisi entre le commerçant et son client. CONVERZA ne transporte ni les messages, ni l'argent, ni les marchandises : elle prépare, enregistre et suit.",
        ],
      },
      {
        title: "2. Ouvrir un compte",
        body: [
          "Le compte s'ouvre avec une adresse e-mail et un numéro WhatsApp qui appartient réellement au commerçant. Les informations doivent être exactes : c'est ce que ses clients verront.",
          "Le propriétaire du compte peut inviter des agents. Il reste responsable de ce que font ses agents avec les commandes et les clients de la boutique.",
        ],
      },
      {
        title: "3. Abonnements et paiement",
        body: [
          "Les prix sont affichés en gourdes, par mois. Le paiement se fait à la main (MonCash, NatCash, virement), puis l'abonnement est activé après vérification : il peut donc s'écouler quelques heures entre l'envoi et l'activation.",
          "L'abonnement court jusqu'à la date affichée dans la page Abonnement. Passé cette date, et après trois jours de tolérance, le compte retombe au plan Gratis : les fonctions payantes se referment, mais aucune donnée n'est perdue. Un renouvellement les rouvre.",
          "Un mois commencé n'est pas remboursé, sauf si l'interruption vient de CONVERZA.",
        ],
      },
      {
        title: "4. Ce que le commerçant publie",
        body: [
          "Le commerçant est responsable de ses produits, de ses prix, de ses photos et de ses promesses de livraison.",
          "Sont interdits : les produits illégaux, la contrefaçon, les armes, les médicaments vendus sans autorisation, le contenu sexuel, et la publication des données d'une autre personne sans son accord.",
          "CONVERZA peut suspendre une boutique qui enfreint ces règles, ou qui sert manifestement à tromper des acheteurs. Le compte suspendu garde ses données et son propriétaire peut demander une explication.",
          "CONVERZA peut présenter le nom, le logo et le lien de la vitrine d'une boutique qui vend sur sa page d'accueil. Le commerçant peut le refuser à tout moment dans Paramètres → Boutique ; son choix est appliqué dans les minutes qui suivent.",
        ],
      },
      {
        title: "5. Les clients du commerçant",
        body: [
          "La relation commerciale lie le client au commerçant : la livraison, l'échange, le remboursement et le service après-vente sont l'affaire du commerçant.",
          "Un client qui a un problème avec une commande doit s'adresser d'abord au commerçant chez qui il a commandé.",
        ],
      },
      {
        title: "6. Disponibilité du service",
        body: [
          "Le service est fourni tel quel. Il dépend d'éléments que CONVERZA ne maîtrise pas : WhatsApp, la connexion internet, l'électricité, nos hébergeurs.",
          "Nous faisons de notre mieux pour prévenir des interruptions prévisibles, mais nous ne garantissons pas un fonctionnement sans coupure.",
        ],
      },
      {
        title: "7. Suspension et fermeture",
        body: [
          "Un compte peut être suspendu en cas de fraude, d'impayé, ou d'usage interdit. Une suspension ne supprime rien : la vitrine disparaît, les données restent.",
          "Le commerçant peut demander la fermeture de son compte à tout moment. Avant de fermer, il peut exporter son catalogue, ses commandes et ses clients au format Excel.",
        ],
      },
      {
        title: "8. Changement de numéro WhatsApp",
        body: [
          "Un commerçant dont le compte WhatsApp a été piraté peut demander à changer le numéro de sa boutique. La demande exige une preuve et une pièce d'identité, et elle est vérifiée avant d'être appliquée.",
          "CONVERZA peut refuser une demande insuffisamment prouvée : ce contrôle protège le commerçant lui-même, puisque changer le numéro d'une boutique redirige toutes ses commandes.",
        ],
      },
      {
        title: "9. Modifications de ces conditions",
        body: [
          "Ces conditions peuvent évoluer avec le service. Les changements importants sont annoncés dans l'application. Continuer à utiliser CONVERZA après un changement vaut acceptation.",
        ],
      },
      {
        title: "10. Droit applicable",
        body: [
          "Ces conditions sont régies par le droit haïtien. En cas de désaccord, nous cherchons d'abord une solution directe avant toute procédure.",
        ],
      },
    ],
  },
  privacy: {
    title: "Politique de confidentialité",
    subtitle: "Quelles données nous détenons, pourquoi, combien de temps, et qui peut les voir.",
    sections: [
      {
        title: "1. Ce que nous collectons",
        body: [
          "Pour le compte : adresse e-mail, nom, numéro WhatsApp, et la langue choisie.",
          "Pour la boutique : nom, catégorie, adresse, horaires, logo, photos, produits, prix et zones de livraison.",
          "Pour l'activité : commandes, articles vendus, paiements enregistrés, stock, dépenses, fournisseurs, et les clients que le commerçant enregistre ou que ses clients saisissent eux-mêmes sur la vitrine (nom, téléphone, adresse de livraison, remarques).",
          "Pour une demande de changement de numéro : les preuves fournies et une pièce d'identité.",
          "Pour l'exploitation : un journal des actions de l'administration et un journal des erreurs techniques.",
          "Nous n'utilisons aucun traceur publicitaire, et nous ne vendons aucune donnée.",
        ],
      },
      {
        title: "2. Ce qui est public, et ce qui ne l'est jamais",
        body: [
          "Est public, parce que c'est le but de la vitrine : le nom de la boutique, sa catégorie, son adresse, ses horaires, ses photos, ses produits, ses prix, ses zones de livraison et son numéro WhatsApp.",
          "N'est jamais public : les comptes MonCash, NatCash, bancaires ou USDT du commerçant, ses prix d'achat et ses marges, sa liste de clients, ses commandes, ses dépenses, et les pièces d'un changement de numéro.",
          "Une boutique suspendue disparaît de la vitrine publique.",
          "Le nom et le logo d'une boutique qui vend peuvent apparaître sur la page d'accueil de CONVERZA, avec un lien vers sa vitrine, sauf si le commerçant l'a refusé dans ses réglages.",
        ],
      },
      {
        title: "3. Combien de temps nous gardons",
        body: [
          "Pièce d'identité et preuves d'un changement de numéro : supprimées dès que la demande est tranchée ou annulée. Un envoi abandonné est supprimé au bout de sept jours. Une demande laissée sans décision perd ses pièces au bout de trente jours.",
          "Données du compte et de l'activité : conservées tant que le compte existe. À la fermeture, elles sont supprimées.",
          "Journal des actions de l'administration : conservé tant que le compte existe, parce qu'il permet de savoir qui a validé quoi en cas de contestation.",
          "Journal des erreurs techniques : messages techniques seulement, sans contenu de conversation.",
        ],
      },
      {
        title: "4. Qui peut voir quoi",
        body: [
          "Le commerçant voit tout de sa boutique. Ses agents ne voient que ce que leurs droits permettent.",
          "Un commerçant ne peut pas voir les données d'un autre commerçant : la base l'empêche, compte par compte.",
          "L'équipe CONVERZA n'ouvre un compte que pour dépanner, et chaque consultation d'un compte marchand est inscrite au journal des actions.",
          "Nos prestataires techniques hébergent le service : la base de données et les fichiers chez Supabase, l'application chez Vercel.",
        ],
      },
      {
        title: "5. WhatsApp",
        body: [
          "Les conversations ne passent pas par CONVERZA. L'application prépare un message ; c'est WhatsApp qui l'envoie, depuis le téléphone du commerçant ou de son client.",
          "Ce qui se passe dans WhatsApp relève de WhatsApp et de ses propres règles, pas de cette politique.",
        ],
      },
      {
        title: "6. Les droits du commerçant",
        body: [
          "Accéder à ses données et les corriger : depuis Réglages, le catalogue et les fiches clients.",
          "Les emporter : export Excel du catalogue, des commandes et des clients.",
          "Les faire supprimer : en demandant la fermeture du compte.",
        ],
      },
      {
        title: "7. Si tu es client d'une boutique",
        body: [
          "Les informations que tu saisis en commandant (nom, téléphone, adresse) appartiennent au commerçant chez qui tu commandes. CONVERZA les héberge pour lui.",
          "Pour les corriger ou les faire supprimer, adresse-toi au commerçant. Si tu n'obtiens pas de réponse, écris-nous.",
        ],
      },
      {
        title: "8. Sécurité",
        body: [
          "Les échanges avec l'application sont chiffrés en transit. Les pièces d'identité sont déposées dans un espace privé, jamais listé publiquement, et accessible seulement par un lien signé de courte durée.",
          "Les clés qui donnent un accès étendu à la base ne quittent jamais le serveur.",
          "Aucun système n'est parfaitement sûr. En cas d'incident touchant des données de marchands, nous prévenons les comptes concernés.",
        ],
      },
      {
        title: "9. Âge",
        body: ["Le service est destiné à des commerçants majeurs. Nous ne créons pas de compte pour un mineur."],
      },
      {
        title: "10. Modifications",
        body: [
          "Cette politique suit le produit : quand nous changeons ce que le logiciel fait des données, nous changeons ce document et nous l'annonçons dans l'application.",
        ],
      },
    ],
  },
};

const ht: LegalCopy = {
  back: "Tounen",
  updated: (d) => `Dènye mizajou : ${d}`,
  noDate: "Dokiman an an vigè jodi a.",
  contactTitle: "Kontakte nou",
  noContact:
    "Kowòdone kontak yo poko pibliye. Pandan tan sa a, ekri machann kote ou te kòmande a, oswa pase sou paj èd aplikasyon an.",
  entityFallback: "CONVERZA",
  terms: {
    title: "Kondisyon itilizasyon",
    subtitle: "Sa CONVERZA fè, sa li pa fè, ak sa chak moun angaje l respekte.",
    sections: [
      {
        title: "1. Sa CONVERZA fè",
        body: [
          "CONVERZA bay yon machann yon vitrin pou l pataje ak yon lyen, yon katalòg, ak yon swivi kòmand li depi premye demann jiska lajan an antre.",
          "Konvèsasyon yo pase nan WhatsApp, epi lajan an pase nan mwayen peman machann lan ak kliyan an chwazi. CONVERZA pa pote ni mesaj, ni lajan, ni machandiz : li prepare, li anrejistre, li swiv.",
        ],
      },
      {
        title: "2. Louvri yon kont",
        body: [
          "Kont lan louvri ak yon imèl ak yon nimewo WhatsApp ki reyèlman pou machann lan. Enfòmasyon yo dwe kòrèk : se sa kliyan l yo pral wè.",
          "Patwon kont lan ka envite ajan. Se li ki responsab sa ajan l yo fè ak kòmand ak kliyan boutik la.",
        ],
      },
      {
        title: "3. Abònman ak peman",
        body: [
          "Pri yo afiche an goud, pa mwa. Peman fèt alamen (MonCash, NatCash, vireman), epi abònman an aktive apre verifikasyon : konsa kèk èdtan ka pase ant voye a ak aktivasyon an.",
          "Abònman an kouri jiska dat ki afiche nan paj Abònman. Apre dat sa a, ak twa jou tolerans, kont lan tounen nan plan Gratis : fonksyon peyan yo fèmen, men anyen pa pèdi. Yon renouvèlman rouvri yo.",
          "Yon mwa ki kòmanse pa ranbouse, sof si se CONVERZA ki lakòz koupi a.",
        ],
      },
      {
        title: "4. Sa machann lan pibliye",
        body: [
          "Machann lan responsab pwodwi l, pri l, foto l ak pwomès livrezon l.",
          "Entèdi : pwodwi ilegal, kontrefason, zam, medikaman san otorizasyon, kontni seksyèl, ak pibliye done yon lòt moun san akò l.",
          "CONVERZA ka sispann yon boutik ki kraze règ sa yo, oswa ki klèman ap twonpe achtè. Kont ki sispann kenbe done l epi patwon l ka mande yon eksplikasyon.",
          "CONVERZA ka montre non, logo ak lyen vitrin yon boutik k ap vann sou paj akèy li. Machann lan ka refize sa nenpòt lè nan Reglaj → Boutik ; chwa l aplike nan kèk minit.",
        ],
      },
      {
        title: "5. Kliyan machann lan",
        body: [
          "Relasyon komèsyal la mare kliyan an ak machann lan : livrezon, echanj, ranbousman ak sèvis apre vant se zafè machann lan.",
          "Yon kliyan ki gen yon pwoblèm ak yon kòmand dwe pale ak machann kote l te kòmande a anvan.",
        ],
      },
      {
        title: "6. Disponibilite sèvis la",
        body: [
          "Sèvis la bay jan l ye. Li depann de bagay CONVERZA pa kontwole : WhatsApp, koneksyon entènèt, kouran, ak moun k ap loje sèvis la.",
          "Nou fè sa nou kapab pou avèti lè yon koupi previzib ap rive, men nou pa garanti yon fonksyònman san kase.",
        ],
      },
      {
        title: "7. Sispansyon ak fèmti",
        body: [
          "Yon kont ka sispann pou fwod, lajan ki pa peye, oswa yon itilizasyon entèdi. Sispansyon pa efase anyen : vitrin lan disparèt, done yo rete.",
          "Machann lan ka mande fèmen kont li nenpòt lè. Anvan fèmen, li ka ekspòte katalòg, kòmand ak kliyan l nan Excel.",
        ],
      },
      {
        title: "8. Chanje nimewo WhatsApp",
        body: [
          "Yon machann ki pèdi kont WhatsApp li nan men pirat ka mande chanje nimewo boutik la. Demann lan mande yon prèv ak yon pyès idantite, epi li verifye anvan li aplike.",
          "CONVERZA ka refize yon demann ki pa gen ase prèv : kontwòl sa a pwoteje machann lan li menm, paske chanje nimewo yon boutik voye tout kòmand li sou yon lòt nimewo.",
        ],
      },
      {
        title: "9. Chanjman nan kondisyon sa yo",
        body: [
          "Kondisyon sa yo ka chanje ak sèvis la. Chanjman enpòtan yo anonse nan aplikasyon an. Kontinye sèvi ak CONVERZA apre yon chanjman vle di ou dakò.",
        ],
      },
      {
        title: "10. Lwa ki aplike",
        body: ["Kondisyon sa yo swiv lwa ayisyen. Si gen dezakò, nou chèche yon solisyon dirèk anvan tout pwosedi."],
      },
    ],
  },
  privacy: {
    title: "Politik konfidansyalite",
    subtitle: "Ki done nou kenbe, pou kisa, pou konbyen tan, ak kiyès ki ka wè yo.",
    sections: [
      {
        title: "1. Sa nou kolekte",
        body: [
          "Pou kont lan : imèl, non, nimewo WhatsApp, ak lang ou chwazi.",
          "Pou boutik la : non, kategori, adrès, lè louvri, logo, foto, pwodwi, pri ak zòn livrezon.",
          "Pou aktivite a : kòmand, atik vandi, peman anrejistre, stòk, depans, founisè, ak kliyan machann lan anrejistre oswa kliyan yo tape tèt yo sou vitrin lan (non, telefòn, adrès livrezon, nòt).",
          "Pou yon demann chanjman nimewo : prèv yo bay ak yon pyès idantite.",
          "Pou egzplwatasyon : yon jounal aksyon administrasyon an ak yon jounal erè teknik.",
          "Nou pa sèvi ak okenn tracker piblisitè, epi nou pa vann okenn done.",
        ],
      },
      {
        title: "2. Sa ki piblik, ak sa ki pa janm piblik",
        body: [
          "Piblik, paske se sa vitrin lan la pou : non boutik la, kategori l, adrès li, lè l louvri, foto l, pwodwi l, pri l, zòn livrezon l ak nimewo WhatsApp li.",
          "Pa janm piblik : kont MonCash, NatCash, bankè oswa USDT machann lan, pri acha l ak maj li, lis kliyan l, kòmand li, depans li, ak pyès yon chanjman nimewo.",
          "Yon boutik ki sispann disparèt nan vitrin piblik la.",
          "Non ak logo yon boutik k ap vann ka parèt sou paj akèy CONVERZA, ak yon lyen sou vitrin li, sof si machann lan refize sa nan reglaj li.",
        ],
      },
      {
        title: "3. Konbyen tan nou kenbe",
        body: [
          "Pyès idantite ak prèv yon chanjman nimewo : efase kou demann lan tranche oswa anile. Yon voye ki abandone efase apre sèt jou. Yon demann ki rete san desizyon pèdi pyès li apre trant jou.",
          "Done kont lan ak aktivite a : kenbe toutotan kont lan egziste. Lè l fèmen, yo efase.",
          "Jounal aksyon administrasyon an : kenbe toutotan kont lan egziste, paske li pèmèt konnen kiyès ki te valide kisa si gen kontestasyon.",
          "Jounal erè teknik : sèlman mesaj teknik, san kontni konvèsasyon.",
        ],
      },
      {
        title: "4. Kiyès ki ka wè kisa",
        body: [
          "Machann lan wè tout bagay nan boutik li. Ajan l yo wè sèlman sa dwa yo pèmèt.",
          "Yon machann pa ka wè done yon lòt machann : baz la bloke sa, kont pa kont.",
          "Ekip CONVERZA louvri yon kont sèlman pou depane, epi chak fwa yon kont machann konsilte sa ekri nan jounal aksyon yo.",
          "Founisè teknik nou yo loje sèvis la : baz done ak fichye yo lakay Supabase, aplikasyon an lakay Vercel.",
        ],
      },
      {
        title: "5. WhatsApp",
        body: [
          "Konvèsasyon yo pa pase nan CONVERZA. Aplikasyon an prepare yon mesaj ; se WhatsApp ki voye l, depi telefòn machann lan oswa kliyan an.",
          "Sa ki pase anndan WhatsApp se zafè WhatsApp ak règ pa l, pa politik sa a.",
        ],
      },
      {
        title: "6. Dwa machann lan",
        body: [
          "Wè done l ak korije yo : nan Reglaj, katalòg la ak fich kliyan yo.",
          "Pote yo ale : ekspò Excel katalòg, kòmand ak kliyan.",
          "Fè efase yo : lè l mande fèmen kont lan.",
        ],
      },
      {
        title: "7. Si ou se kliyan yon boutik",
        body: [
          "Enfòmasyon ou tape lè w ap kòmande (non, telefòn, adrès) se pou machann kote w ap kòmande a. CONVERZA loje yo pou li.",
          "Pou korije yo oswa fè efase yo, pale ak machann lan. Si li pa reponn, ekri nou.",
        ],
      },
      {
        title: "8. Sekirite",
        body: [
          "Echanj ak aplikasyon an chiffre pandan y ap vwayaje. Pyès idantite yo depoze nan yon espas prive, ki pa janm parèt piblikman, epi ki louvri sèlman ak yon lyen siyen ki dire yon ti moman.",
          "Kle ki bay yon aksè laj sou baz la pa janm kite sèvè a.",
          "Okenn sistèm pa san fay. Si yon ensidan touche done machann, nou avèti kont ki konsène yo.",
        ],
      },
      {
        title: "9. Laj",
        body: ["Sèvis la fèt pou machann majè. Nou pa kreye kont pou yon minè."],
      },
      {
        title: "10. Chanjman",
        body: [
          "Politik sa a swiv pwodwi a : lè nou chanje sa lojisyèl la fè ak done yo, nou chanje dokiman sa a epi nou anonse l nan aplikasyon an.",
        ],
      },
    ],
  },
};

const en: LegalCopy = {
  back: "Back",
  updated: (d) => `Last updated: ${d}`,
  noDate: "Document in force as of today.",
  contactTitle: "Contact us",
  noContact:
    "Contact details are not published yet. In the meantime, write to the merchant you ordered from, or use the help page in the app.",
  entityFallback: "CONVERZA",
  terms: {
    title: "Terms of use",
    subtitle: "What CONVERZA does, what it does not do, and what each side commits to.",
    sections: [
      {
        title: "1. What CONVERZA does",
        body: [
          "CONVERZA gives a merchant a storefront to share as a link, a catalogue, and order tracking from the first message to the money collected.",
          "Conversations go through WhatsApp, and money goes through whatever payment method the merchant and the customer agree on. CONVERZA carries neither the messages, nor the money, nor the goods: it prepares, records and tracks.",
        ],
      },
      {
        title: "2. Opening an account",
        body: [
          "An account needs an email address and a WhatsApp number that genuinely belongs to the merchant. The information must be accurate: it is what customers will see.",
          "The account owner can invite agents, and remains responsible for what those agents do with the shop's orders and customers.",
        ],
      },
      {
        title: "3. Subscriptions and payment",
        body: [
          "Prices are shown in gourdes, per month. Payment is made by hand (MonCash, NatCash, bank transfer), then the plan is activated after verification, so a few hours may pass between sending and activation.",
          "A plan runs until the date shown on the Subscription page. After that date, plus three days of grace, the account falls back to the Free plan: paid features close, but no data is lost. Renewing reopens them.",
          "A started month is not refunded, unless the interruption comes from CONVERZA.",
        ],
      },
      {
        title: "4. What the merchant publishes",
        body: [
          "The merchant is responsible for their products, prices, photos and delivery promises.",
          "Forbidden: illegal goods, counterfeits, weapons, medicines sold without authorisation, sexual content, and publishing another person's data without their consent.",
          "CONVERZA may suspend a shop that breaks these rules, or that plainly exists to mislead buyers. A suspended account keeps its data and its owner may ask for an explanation.",
          "CONVERZA may feature the name, logo and storefront link of a shop that is selling on its home page. The merchant can refuse this at any time in Settings → Store; the choice takes effect within minutes.",
        ],
      },
      {
        title: "5. The merchant's customers",
        body: [
          "The commercial relationship is between the customer and the merchant: delivery, exchange, refund and after-sales are the merchant's responsibility.",
          "A customer with an order problem should first contact the merchant they ordered from.",
        ],
      },
      {
        title: "6. Availability",
        body: [
          "The service is provided as is. It depends on things CONVERZA does not control: WhatsApp, internet access, electricity, our hosting providers.",
          "We do our best to warn about foreseeable interruptions, but we do not guarantee uninterrupted service.",
        ],
      },
      {
        title: "7. Suspension and closure",
        body: [
          "An account may be suspended for fraud, unpaid subscription, or forbidden use. Suspension deletes nothing: the storefront disappears, the data stays.",
          "A merchant may ask to close their account at any time. Before closing, they can export their catalogue, orders and customers to Excel.",
        ],
      },
      {
        title: "8. Changing the WhatsApp number",
        body: [
          "A merchant whose WhatsApp account has been hijacked can ask to change the shop's number. The request requires proof and an identity document, and is verified before being applied.",
          "CONVERZA may refuse a request that is not sufficiently proven: this check protects the merchant, since changing a shop's number redirects all of its orders.",
        ],
      },
      {
        title: "9. Changes to these terms",
        body: [
          "These terms may change with the service. Significant changes are announced in the app. Continuing to use CONVERZA after a change means accepting it.",
        ],
      },
      {
        title: "10. Governing law",
        body: [
          "These terms are governed by Haitian law. In case of disagreement, we look for a direct solution before any proceedings.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy policy",
    subtitle: "What data we hold, why, for how long, and who can see it.",
    sections: [
      {
        title: "1. What we collect",
        body: [
          "For the account: email address, name, WhatsApp number, and the chosen language.",
          "For the shop: name, category, address, opening hours, logo, photos, products, prices and delivery zones.",
          "For the activity: orders, items sold, recorded payments, stock, expenses, suppliers, and the customers a merchant records or that customers enter themselves on the storefront (name, phone, delivery address, notes).",
          "For a number-change request: the proof provided and an identity document.",
          "For operations: a log of administration actions and a log of technical errors.",
          "We use no advertising trackers, and we sell no data.",
        ],
      },
      {
        title: "2. What is public, and what never is",
        body: [
          "Public, because that is what a storefront is for: the shop name, category, address, opening hours, photos, products, prices, delivery zones and WhatsApp number.",
          "Never public: the merchant's MonCash, NatCash, bank or USDT accounts, their purchase costs and margins, their customer list, their orders, their expenses, and the documents of a number-change request.",
          "A suspended shop disappears from the public storefront.",
          "The name and logo of a shop that is selling may appear on the CONVERZA home page, with a link to its storefront, unless the merchant has refused this in their settings.",
        ],
      },
      {
        title: "3. How long we keep it",
        body: [
          "Identity document and proof of a number change: deleted as soon as the request is decided or cancelled. An abandoned upload is deleted after seven days. A request left undecided loses its documents after thirty days.",
          "Account and business data: kept as long as the account exists. On closure, they are deleted.",
          "Administration action log: kept as long as the account exists, because it shows who approved what if a decision is contested.",
          "Technical error log: technical messages only, with no conversation content.",
        ],
      },
      {
        title: "4. Who can see what",
        body: [
          "The merchant sees everything in their shop. Their agents see only what their permissions allow.",
          "One merchant cannot see another merchant's data: the database prevents it, account by account.",
          "The CONVERZA team opens an account only to provide support, and every visit to a merchant account is written to the action log.",
          "Our technical providers host the service: the database and files at Supabase, the application at Vercel.",
        ],
      },
      {
        title: "5. WhatsApp",
        body: [
          "Conversations do not pass through CONVERZA. The app prepares a message; WhatsApp sends it, from the merchant's or the customer's phone.",
          "What happens inside WhatsApp is governed by WhatsApp and its own rules, not by this policy.",
        ],
      },
      {
        title: "6. The merchant's rights",
        body: [
          "See and correct their data: from Settings, the catalogue and the customer records.",
          "Take it with them: Excel export of the catalogue, orders and customers.",
          "Have it deleted: by asking to close the account.",
        ],
      },
      {
        title: "7. If you are a shop's customer",
        body: [
          "The information you enter when ordering (name, phone, address) belongs to the merchant you order from. CONVERZA hosts it on their behalf.",
          "To correct it or have it deleted, contact the merchant. If you get no answer, write to us.",
        ],
      },
      {
        title: "8. Security",
        body: [
          "Exchanges with the app are encrypted in transit. Identity documents are stored in a private area, never listed publicly, reachable only through a short-lived signed link.",
          "The keys that grant broad access to the database never leave the server.",
          "No system is perfectly safe. If an incident affects merchant data, we notify the accounts concerned.",
        ],
      },
      {
        title: "9. Age",
        body: ["The service is intended for adult merchants. We do not create accounts for minors."],
      },
      {
        title: "10. Changes",
        body: [
          "This policy follows the product: when we change what the software does with data, we change this document and announce it in the app.",
        ],
      },
    ],
  },
};

export const LEGAL_COPY: Record<Language, LegalCopy> = { fr, ht, en };

/** Ligne de contact, à partir de ce que le super-admin a saisi. */
export function contactLines(info: LegalInfo): string[] {
  return [info.entity, info.email, info.whatsapp, info.address].map((v) => v.trim()).filter(Boolean);
}
