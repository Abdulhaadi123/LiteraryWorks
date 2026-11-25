import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { adminStatus, clientIp, COOKIE, readSession, sameOrigin, type Session } from "./auth";
import { StoreError } from "./kv";

/** What a page or an API route of the admin area needs to know about the person asking. */

/** The signed-in owner for this request, or null. (Asked once per request, however many components want it.) */
export const currentSession = cache(async (): Promise<Session | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  return readSession(token);
});

/** For a page: the session, or a redirect to the sign-in page (which then returns here). */
export async function requireAdmin(next: string): Promise<Session> {
  if (!adminStatus().ready) redirect("/admin/login");
  const session = await currentSession();
  if (!session) redirect(`/admin/login?next=${encodeURIComponent(next)}`);
  return session;
}

export async function requestContext() {
  const h = await headers();
  return { ip: clientIp(h), ua: h.get("user-agent") ?? "" };
}

const noStore = { "Cache-Control": "no-store" };

export const json = (body: object, status = 200, extra?: Record<string, string>) => NextResponse.json(body, { status, headers: { ...noStore, ...extra } });

/**
 * For an API route: the session, or the response to send instead. A change (anything but GET) must also come from
 * a page of this site: its Origin header has to be our own host (the cookie's SameSite=Strict is the first line,
 * this is the second).
 */
export async function guard(request: NextRequest, { change }: { change: boolean }): Promise<{ session: Session } | { response: NextResponse }> {
  if (change && !sameOrigin(request.headers)) return { response: json({ message: "This request did not come from the admin area." }, 403) };
  try {
    const session = await readSession(request.cookies.get(COOKIE)?.value);
    if (!session) return { response: json({ message: "Please sign in again." }, 401) };
    return { session };
  } catch (error) {
    if (error instanceof StoreError) return { response: json({ message: "The store is unavailable. Please try again." }, 503) };
    throw error;
  }
}

/** A cookie that carries the session (or, with maxAge 0, ends it in the browser). */
export function sessionCookie(value: string, maxAge: number) {
  return { name: COOKIE, value, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/", maxAge };
}
