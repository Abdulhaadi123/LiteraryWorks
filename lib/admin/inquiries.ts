import { randomBytes } from "node:crypto";
import { cmd, getKv, pipe, StoreError } from "./kv";

/**
 * The inquiries the website receives (the contact form and the assistant's form), kept for the admin inbox. Each is
 * one JSON value under lw:inq:<id>, and one sorted-set index (lw:inq:index, scored by time) lists them newest first.
 */

export const statuses = ["new", "read", "replied", "archived"] as const;
export type Status = (typeof statuses)[number];
export const statusLabel: Record<Status, string> = { new: "New", read: "Read", replied: "Replied", archived: "Archived" };

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type StoredInquiry = {
  id: string;
  createdAt: number;
  updatedAt: number;
  name: string;
  email: string;
  company: string;
  interest: string;
  message: string;
  /** "form": the contact page. "assistant": the form inside the chat, which attaches the conversation. */
  source: "form" | "assistant";
  conversation?: ChatTurn[];
  status: Status;
  note: string;
  /** Whether the e-mail to the team went out (null: e-mail is not set up). */
  notified: boolean | null;
  /** Two-letter country the visit came from, where the host says (Vercel does). */
  country?: string;
};

const INDEX = "lw:inq:index";
const key = (id: string) => `lw:inq:${id}`;
/** The inbox shows at most this many (the newest). */
export const INBOX_LIMIT = 1000;
export const NOTE_MAX = 2000;
const ID = /^[A-Za-z0-9_-]{8,40}$/;

export const storeReady = () => getKv() !== null;
export const validId = (id: string) => ID.test(id);

export type NewInquiry = Pick<StoredInquiry, "name" | "email" | "company" | "interest" | "message" | "conversation" | "notified" | "country">;

/** Saves a new inquiry; resolves with it. Throws a StoreError if the store is missing or unreachable. */
export async function saveInquiry(input: NewInquiry): Promise<StoredInquiry> {
  const now = Date.now();
  const inquiry: StoredInquiry = {
    id: randomBytes(9).toString("base64url"),
    createdAt: now,
    updatedAt: now,
    name: input.name,
    email: input.email,
    company: input.company,
    interest: input.interest,
    message: input.message,
    source: input.conversation?.length ? "assistant" : "form",
    conversation: input.conversation,
    status: "new",
    note: "",
    notified: input.notified,
    country: input.country,
  };
  // the record and its place in the index are written together
  await pipe([
    ["SET", key(inquiry.id), JSON.stringify(inquiry)],
    ["ZADD", INDEX, now, inquiry.id],
  ]);
  return inquiry;
}

const parse = (raw: string | null): StoredInquiry | null => {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as StoredInquiry;
    return v && typeof v === "object" && typeof v.id === "string" ? v : null;
  } catch {
    return null;
  }
};

/** The newest inquiries (at most INBOX_LIMIT), newest first. */
export async function listInquiries(): Promise<StoredInquiry[]> {
  const ids = (await cmd(["ZREVRANGE", INDEX, 0, INBOX_LIMIT - 1])) as string[];
  if (!ids.length) return [];
  const raws = (await cmd(["MGET", ...ids.map(key)])) as (string | null)[];
  return raws.map(parse).filter((v): v is StoredInquiry => v !== null);
}

export async function getInquiry(id: string): Promise<StoredInquiry | null> {
  if (!validId(id)) return null;
  return parse((await cmd(["GET", key(id)])) as string | null);
}

export type Patch = { status?: unknown; note?: unknown };

/** Changes an inquiry's status and/or its note. Returns it, or null if it does not exist; throws RangeError for a value that is not allowed. */
export async function updateInquiry(id: string, patch: Patch): Promise<StoredInquiry | null> {
  const current = await getInquiry(id);
  if (!current) return null;
  const next = { ...current };
  if (patch.status !== undefined) {
    if (typeof patch.status !== "string" || !(statuses as readonly string[]).includes(patch.status)) throw new RangeError("That status is not allowed.");
    next.status = patch.status as Status;
  }
  if (patch.note !== undefined) {
    if (typeof patch.note !== "string" || patch.note.length > NOTE_MAX) throw new RangeError(`A note can be up to ${NOTE_MAX} characters.`);
    next.note = patch.note.replace(/\r\n/g, "\n").trim();
  }
  next.updatedAt = Date.now();
  await cmd(["SET", key(id), JSON.stringify(next)]);
  return next;
}

/** Records whether the team e-mail went out (it is sent after the inquiry is saved). */
export async function markNotified(id: string, notified: boolean): Promise<void> {
  const current = await getInquiry(id);
  if (current) await cmd(["SET", key(id), JSON.stringify({ ...current, notified })]);
}

export async function deleteInquiry(id: string): Promise<boolean> {
  if (!validId(id)) return false;
  const [removed] = await pipe([["DEL", key(id)], ["ZREM", INDEX, id]]);
  return Number(removed) > 0;
}

// ---------------------------------------------------------------------------------------------------------------------
// what the inbox and the overview show
// ---------------------------------------------------------------------------------------------------------------------

export type Filter = { status?: Status | "all"; topic?: string; q?: string };

export function filterInquiries(all: StoredInquiry[], f: Filter): StoredInquiry[] {
  const q = (f.q ?? "").trim().toLowerCase();
  return all.filter((i) => {
    if (f.status && f.status !== "all" && i.status !== f.status) return false;
    if (f.topic && i.interest !== f.topic) return false;
    if (q && !`${i.name}\n${i.email}\n${i.company}\n${i.message}\n${i.note}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function countByStatus(all: StoredInquiry[]): Record<Status | "all", number> {
  const n = { all: all.length, new: 0, read: 0, replied: 0, archived: 0 };
  for (const i of all) n[i.status]++;
  return n;
}

const DAY = 86_400_000;
const dayStart = (t: number) => Math.floor(t / DAY) * DAY;

export type Summary = {
  total: number;
  fresh: number;
  last7: number;
  prev7: number;
  last30: number;
  /** One entry per day, oldest first, for the last `days` days (UTC days). */
  daily: { day: number; count: number }[];
  topics: { name: string; count: number }[];
  sources: { form: number; assistant: number };
  /** How many were saved but did not reach the team by e-mail. */
  unnotified: number;
};

export function summarize(all: StoredInquiry[], now = Date.now(), days = 14): Summary {
  const today = dayStart(now);
  const daily = Array.from({ length: days }, (_, k) => ({ day: today - (days - 1 - k) * DAY, count: 0 }));
  const topics = new Map<string, number>();
  const s: Summary = { total: all.length, fresh: 0, last7: 0, prev7: 0, last30: 0, daily, topics: [], sources: { form: 0, assistant: 0 }, unnotified: 0 };
  for (const i of all) {
    if (i.status === "new") s.fresh++;
    const age = now - i.createdAt;
    if (age < 7 * DAY) s.last7++;
    else if (age < 14 * DAY) s.prev7++;
    if (age < 30 * DAY) s.last30++;
    const slot = daily.find((d) => d.day === dayStart(i.createdAt));
    if (slot) slot.count++;
    topics.set(i.interest, (topics.get(i.interest) ?? 0) + 1);
    s.sources[i.source]++;
    if (i.notified === false) s.unnotified++;
  }
  s.topics = [...topics].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return s;
}

/** A cell for a CSV file: quoted, and made harmless where a spreadsheet would run it as a formula. */
export function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(all: StoredInquiry[]): string {
  const head = ["Received (UTC)", "Status", "Name", "Email", "Company", "Topic", "Source", "Message", "Note", "Team e-mail sent", "Country", "ID"];
  const rows = all.map((i) => [
    new Date(i.createdAt).toISOString(),
    statusLabel[i.status],
    i.name,
    i.email,
    i.company,
    i.interest,
    i.source === "assistant" ? "Website assistant" : "Contact form",
    i.message,
    i.note,
    i.notified === null ? "n/a" : i.notified ? "yes" : "no",
    i.country ?? "",
    i.id,
  ]);
  // a leading byte-order mark, so Excel reads the file as UTF-8
  return "﻿" + [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

export { StoreError };
