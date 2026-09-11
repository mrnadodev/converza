import { generateExcelTemplate } from "@/lib/excel";
import { NextResponse } from "next/server";

export async function GET() {
  const csvContent = generateExcelTemplate();
  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="modele_katalog_converza.csv"',
    },
  });
}
