import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { clientIp, COOKIE, endAllSessions, endSession, readSession, sameOrigin } from "@/lib/admin/auth";
import { json, sessionCookie } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

/** Ends this session; with { "everywhere": true }, every session on every device. The cookie is cleared either way. */
export async function POST(request: NextRequest) {
  if (!sameOrigin(request.headers)) return json({ message: "This request did not come from the admin area." }, 403);
  const body = (await request.json().catch(() => ({}))) as { everywhere?: unknown };
  const ctx = { ip: clientIp(request.headers), ua: request.headers.get("user-agent") ?? "" };
  try {
    const session = await readSession(request.cookies.get(COOKIE)?.value);
    if (session) {
      if (body && body.everywhere === true) await endAllSessions(ctx);
      else await endSession(session, ctx);
    }
  } catch {
    // if the store cannot be reached the cookie is still cleared below; "everywhere" is then not recorded, so say so
    if (body && body.everywhere === true) return json({ message: "Could not reach the store, so the other sessions were not ended. Please try again." }, 503);
  }
  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(sessionCookie("", 0));
  return response;
}
