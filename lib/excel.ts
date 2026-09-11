import type { Currency, Product, StockState } from "./types";

/**
 * Génère le contenu CSV compatible Excel (UTF-8 avec BOM) pour le téléchargement du modèle de catalogue.
 */
export function generateExcelTemplate(): string {
  const headers = [
    "Nom du Produit",
    "Categorie",
    "Prix",
    "Devise",
    "Unite",
    "Quantite en stock",
  ];

  const sampleRows = [
    ["Robe Soirée Satin", "Rad", "4500", "HTG", "inite", "10"],
    ["Diri Tchako 25kg", "Grenn", "1200", "HTG", "sak", "25"],
    ["Lwil Mazola 5L", "Manje", "3200", "HTG", "boutèy", "15"],
  ];

  const bom = "\uFEFF"; // Byte Order Mark pour forcer Excel à ouvrir en UTF-8
  const csvContent = [
    headers.join(";"),
    ...sampleRows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";")),
  ].join("\r\n");

  return bom + csvContent;
}

export interface ImportResult {
  products: Partial<Product>[];
  errors: string[];
}

/**
 * Parse un fichier CSV / Excel importé en liste de produits pour Converza.
 */
export function parseBulkProducts(csvText: string, businessId: string): ImportResult {
  const errors: string[] = [];
  const products: Partial<Product>[] = [];

  // Nettoyer le BOM éventuel et séparer les lignes
  const cleanText = csvText.replace(/^\uFEFF/, "");
  const lines = cleanText.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length <= 1) {
    return { products: [], errors: ["Fichye a vid oswa li gen sèlman antèt."] };
  }

  // Détecter le séparateur (; ou ,)
  const headerLine = lines[0];
  const sep = headerLine.includes(";") ? ";" : ",";

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Découper la ligne respectant les guillemets
    const cols = splitCsvLine(rawLine, sep);
    if (cols.length < 3) {
      errors.push(`Liy ${i + 1}: Manke enfòmasyon obligatwa (Non, Kategori, Pri).`);
      continue;
    }

    const name = cols[0]?.trim();
    const category = cols[1]?.trim() || "Lòt";
    const rawPrice = cols[2]?.trim().replace(",", ".");
    const rawCurrency = (cols[3]?.trim().toUpperCase() as Currency) || "HTG";
    const unit = cols[4]?.trim() || "inite";
    const rawStock = cols[5]?.trim();

    if (!name) {
      errors.push(`Liy ${i + 1}: Non pwodwi a obligatwa.`);
      continue;
    }

    const priceNumber = parseFloat(rawPrice);
    if (isNaN(priceNumber) || priceNumber < 0) {
      errors.push(`Liy ${i + 1}: Pri "${cols[2]}" pa valid.`);
      continue;
    }

    const price_cents = Math.round(priceNumber * 100);
    const stock_qty = rawStock && !isNaN(parseInt(rawStock)) ? parseInt(rawStock) : null;
    const stock_threshold = 5;

    let stock_state: StockState = "en_stok";
    if (stock_qty !== null) {
      if (stock_qty === 0) stock_state = "fini";
      else if (stock_qty <= stock_threshold) stock_state = "ba_stok";
    }

    products.push({
      business_id: businessId,
      name,
      category,
      price_cents,
      currency: rawCurrency === "USD" ? "USD" : "HTG",
      unit,
      stock_qty,
      stock_threshold,
      stock_state,
      photo_url: null,
      photos: [],
      sold_count: 0,
      is_active: true,
    });
  }

  return { products, errors };
}

function splitCsvLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === sep && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
