export interface BankAccountItem {
  bank: string;
  currency: "HTG" | "USD";
  accountName: string;
  accountNumber: string;
}

export const HAITI_BANKS = [
  "Unibank",
  "Sogebank",
  "BUH",
  "BNC",
  "Capital Bank",
  "CitiBank",
  "Lòt Banque",
];

export function parseBankAccounts(raw?: string | null): BankAccountItem[] {
  if (!raw || !raw.trim()) return [];

  // Essayer de parser en JSON d'abord
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Si format texte hérité (ex: "Unibank HTG: 123-456-7890 | Sogebank USD: 987-654-3210")
  }

  // Fallback de conversion texte brut vers éléments structurés
  const items: BankAccountItem[] = [];
  const parts = raw.split("|").map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    const currency: "HTG" | "USD" = part.includes("USD") ? "USD" : "HTG";
    let bank = "Unibank";
    if (part.toLowerCase().includes("soge")) bank = "Sogebank";
    else if (part.toLowerCase().includes("buh")) bank = "BUH";
    else if (part.toLowerCase().includes("bnc")) bank = "BNC";
    else if (part.toLowerCase().includes("capital")) bank = "Capital Bank";

    const numMatch = part.match(/[\d-]+/);
    const accountNumber = numMatch ? numMatch[0] : part;

    items.push({
      bank,
      currency,
      accountName: "",
      accountNumber,
    });
  }

  return items.length > 0
    ? items
    : [{ bank: "Unibank", currency: "HTG", accountName: "", accountNumber: raw }];
}

export function formatBankAccountsString(items: BankAccountItem[]): string {
  return JSON.stringify(items);
}

export function displayBankAccountsFormatted(raw?: string | null): string {
  const items = parseBankAccounts(raw);
  if (items.length === 0) return raw || "";

  return items
    .map(
      (b) =>
        `${b.bank} (${b.currency})${b.accountName ? ` - ${b.accountName}` : ""}: ${b.accountNumber}`,
    )
    .join(" | ");
}

import type { PayMethod } from "./types";

export interface ActivePayMethodOption {
  id: PayMethod;
  label: string;
  num: number;
}

export function getActivePayMethods(business: {
  phone_e164?: string | null;
  bank_accounts?: string | null;
  zelle_info?: string | null;
  usdt_trc20_address?: string | null;
  moncash_number?: string | null;
  moncash_name?: string | null;
  natcash_number?: string | null;
  natcash_name?: string | null;
}): ActivePayMethodOption[] {
  const options: ActivePayMethodOption[] = [];
  let num = 1;

  // 1. MonCash (actif UNIQUEMENT si moncash_number est renseigné)
  if (business.moncash_number && business.moncash_number.trim().length > 0) {
    options.push({ id: "moncash", label: "MonCash", num: num++ });
  }

  // 2. Natcash (actif UNIQUEMENT si natcash_number est renseigné)
  if (business.natcash_number && business.natcash_number.trim().length > 0) {
    options.push({ id: "natcash", label: "Natcash", num: num++ });
  }

  // 3. Kach nan livrezon (toujours présent)
  options.push({ id: "kach", label: "Kach nan livrezon", num: num++ });

  // 4. USDT TRC20 (actif UNIQUEMENT si usdt_trc20_address est renseigné)
  if (business.usdt_trc20_address && business.usdt_trc20_address.trim().length > 0) {
    options.push({ id: "crypto_usdt", label: "USDT trc20", num: num++ });
  }

  // 5. Zelle (actif UNIQUEMENT si zelle_info est renseigné)
  if (business.zelle_info && business.zelle_info.trim().length > 0) {
    options.push({ id: "zelle", label: "Zelle", num: num++ });
  }

  // 6, 7, 8. Banques Locales (actifs UNIQUEMENT selon les comptes configurés)
  if (business.bank_accounts && business.bank_accounts.trim().length > 0) {
    const parsedBanks = parseBankAccounts(business.bank_accounts);
    for (const b of parsedBanks) {
      if (!b.accountNumber || !b.accountNumber.trim()) continue;
      const bankUpper = b.bank.toUpperCase();

      if (bankUpper.includes("UNI")) {
        const key: PayMethod = b.currency === "USD" ? "unibank_usd" : "unibank_htg";
        if (!options.some((o) => o.id === key)) {
          options.push({ id: key, label: `Unibank (${b.currency})`, num: num++ });
        }
      } else if (bankUpper.includes("BUH")) {
        const key: PayMethod = b.currency === "USD" ? "buh_usd" : "buh_htg";
        if (!options.some((o) => o.id === key)) {
          options.push({ id: key, label: `BUH (${b.currency})`, num: num++ });
        }
      } else if (bankUpper.includes("SOGE")) {
        const key: PayMethod = b.currency === "USD" ? "sogebank_usd" : "sogebank_htg";
        if (!options.some((o) => o.id === key)) {
          options.push({ id: key, label: `Sogebank (${b.currency})`, num: num++ });
        }
      } else {
        const key: PayMethod = "banque_locale";
        if (!options.some((o) => o.id === key)) {
          options.push({ id: key, label: `${b.bank} (${b.currency})`, num: num++ });
        }
      }
    }
  }

  return options;
}
