import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { listInquiries, toCsv } from "@/lib/admin/inquiries";
import { StoreError } from "@/lib/admin/kv";
import { guard, json } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

/** Every inquiry in the inbox as a CSV file (opens in Excel and Google Sheets). */
export async function GET(request: NextRequest) {
  const g = await guard(request, { change: false });
  if ("response" in g) return g.response;
  try {
    const csv = toCsv(await listInquiries());
    const day = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="literary-worx-inquiries-${day}.csv"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof StoreError) return json({ message: "The store is unavailable. Please try again." }, 503);
    throw error;
  }
}
