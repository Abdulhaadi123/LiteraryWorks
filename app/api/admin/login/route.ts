import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { clientIp, login, sameOrigin } from "@/lib/admin/auth";
import { json, sessionCookie } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

/** Signs the owner in. The answer to a failure is always the same sentence, whichever part was wrong. */
export async function POST(request: NextRequest) {
  if (!sameOrigin(request.headers)) return json({ message: "This request did not come from the sign-in page." }, 403);
  if (Number(request.headers.get("content-length") ?? 0) > 4096) return json({ message: "That request is too large." }, 413);
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ message: "Please enter your details." }, 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ message: "Please enter your details." }, 400);

  const result = await login({ email: body.email, password: body.password, code: body.code }, { ip: clientIp(request.headers), ua: request.headers.get("user-agent") ?? "" });
  if (!result.ok) return json({ message: result.message }, result.status, result.retryAfter ? { "Retry-After": String(result.retryAfter) } : undefined);

  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(sessionCookie(result.token, result.maxAge));
  return response;
}
