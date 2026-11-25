import type { NextRequest } from "next/server";
import { deleteInquiry, getInquiry, updateInquiry, validId } from "@/lib/admin/inquiries";
import { StoreError } from "@/lib/admin/kv";
import { guard, json } from "@/lib/admin/session";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Changes an inquiry's status and/or its note: { "status": "read" } or { "note": "…" }. */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  const g = await guard(request, { change: true });
  if ("response" in g) return g.response;
  const { id } = await params;
  if (!validId(id)) return json({ message: "Not found." }, 404);
  if (Number(request.headers.get("content-length") ?? 0) > 16_000) return json({ message: "That request is too large." }, 413);
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ message: "Invalid request." }, 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ message: "Invalid request." }, 400);
  try {
    const updated = await updateInquiry(id, { status: body.status, note: body.note });
    return updated ? json({ inquiry: updated }) : json({ message: "Not found." }, 404);
  } catch (error) {
    if (error instanceof RangeError) return json({ message: error.message }, 400);
    if (error instanceof StoreError) return json({ message: "The store is unavailable. Please try again." }, 503);
    throw error;
  }
}

export async function GET(request: NextRequest, { params }: Ctx) {
  const g = await guard(request, { change: false });
  if ("response" in g) return g.response;
  const { id } = await params;
  try {
    const found = await getInquiry(id);
    return found ? json({ inquiry: found }) : json({ message: "Not found." }, 404);
  } catch (error) {
    if (error instanceof StoreError) return json({ message: "The store is unavailable. Please try again." }, 503);
    throw error;
  }
}

/** Deletes an inquiry for good. */
export async function DELETE(request: NextRequest, { params }: Ctx) {
  const g = await guard(request, { change: true });
  if ("response" in g) return g.response;
  const { id } = await params;
  try {
    return (await deleteInquiry(id)) ? json({ ok: true }) : json({ message: "Not found." }, 404);
  } catch (error) {
    if (error instanceof StoreError) return json({ message: "The store is unavailable. Please try again." }, 503);
    throw error;
  }
}
