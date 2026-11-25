import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { clientIp, sameOrigin, setupAccount } from "@/lib/admin/auth";
import { json, sessionCookie } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

/** Makes the admin account the first time (see lib/admin/account.ts); answers 409 once it exists. */
export async function POST(request: NextRequest) {
  if (!sameOrigin(request.headers)) return json({ message: "This request did not come from the setup page." }, 403);
  if (Number(request.headers.get("content-length") ?? 0) > 4096) return json({ message: "That request is too large." }, 413);
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ message: "Please fill in the form." }, 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ message: "Please fill in the form." }, 400);

  const result = await setupAccount(
    { email: body.email, password: body.password, confirm: body.confirm, key: body.key },
    { ip: clientIp(request.headers), ua: request.headers.get("user-agent") ?? "" },
  );
  if (!result.ok) return json({ message: result.message }, result.status, result.retryAfter ? { "Retry-After": String(result.retryAfter) } : undefined);

  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(sessionCookie(result.token, result.maxAge));
  return response;
}
