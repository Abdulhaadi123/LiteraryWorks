import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * The admin area's small data store (inquiries, sign-in counters, the sign-in log). It speaks a handful of Redis
 * commands and has two backends:
 *  - Redis over HTTPS (Upstash, which Vercel offers as "Redis" under Storage): set KV_REST_API_URL and
 *    KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN). This is the one for production,
 *    because a serverless host keeps no files between requests.
 *  - A JSON file (.data/store.json): for `npm run dev` and for a server that keeps its disk (LW_STORE=file).
 * Without either, there is no store and the admin area says so.
 */

export type Arg = string | number;
export type Cmd = Arg[];
export type Reply = string | number | null | (string | null)[];

export interface Kv {
  readonly kind: "redis" | "file";
  /** Runs the commands in order, as one request; resolves with each command's reply. */
  run(cmds: Cmd[]): Promise<Reply[]>;
}

export class StoreError extends Error {}

// ---------------------------------------------------------------------------------------------------------------------
// the commands, for the file backend (and for tests): the same behaviour as Redis for exactly this subset
// ---------------------------------------------------------------------------------------------------------------------

type Entry = { t: "s"; v: string; x?: number } | { t: "z"; v: Record<string, number>; x?: number } | { t: "l"; v: string[]; x?: number };
export type Data = Record<string, Entry>;

const alive = (e: Entry | undefined, now: number): e is Entry => !!e && (e.x === undefined || e.x > now);

/** Runs one command against `data` (changing it) and returns the reply. */
export function execute(data: Data, cmd: Cmd, now = Date.now()): Reply {
  const [name, key, ...rest] = cmd;
  const op = String(name).toUpperCase();
  const k = String(key ?? "");
  const get = () => {
    const e = data[k];
    if (alive(e, now)) return e;
    delete data[k];
    return undefined;
  };
  const wrong = () => new StoreError(`WRONGTYPE for ${op}`);
  switch (op) {
    case "GET": {
      const e = get();
      if (!e) return null;
      if (e.t !== "s") throw wrong();
      return e.v;
    }
    case "MGET": {
      return [k, ...rest].map((name) => {
        const e = data[String(name)];
        return alive(e, now) && e.t === "s" ? e.v : null;
      });
    }
    case "SET": {
      const [value, ...flags] = rest;
      let ttl: number | undefined;
      let nx = false;
      for (let i = 0; i < flags.length; i++) {
        const f = String(flags[i]).toUpperCase();
        if (f === "EX") ttl = Number(flags[++i]);
        else if (f === "NX") nx = true;
      }
      if (nx && get()) return null;
      data[k] = { t: "s", v: String(value), x: ttl ? now + ttl * 1000 : undefined };
      return "OK";
    }
    case "DEL": {
      let n = 0;
      for (const name of [k, ...rest].map(String)) {
        if (alive(data[name], now)) n++;
        delete data[name];
      }
      return n;
    }
    case "INCR": {
      const e = get();
      if (e && e.t !== "s") throw wrong();
      const n = (e ? Number(e.v) : 0) + 1;
      data[k] = { t: "s", v: String(n), x: e?.x };
      return n;
    }
    case "EXPIRE": {
      const e = get();
      if (!e) return 0;
      if (String(rest[1] ?? "").toUpperCase() === "NX" && e.x !== undefined) return 0;
      e.x = now + Number(rest[0]) * 1000;
      return 1;
    }
    case "ZADD": {
      const e = get() ?? (data[k] = { t: "z", v: {} });
      if (e.t !== "z") throw wrong();
      const fresh = !(String(rest[1]) in e.v);
      e.v[String(rest[1])] = Number(rest[0]);
      return fresh ? 1 : 0;
    }
    case "ZREM": {
      const e = get();
      if (!e) return 0;
      if (e.t !== "z") throw wrong();
      const had = String(rest[0]) in e.v;
      delete e.v[String(rest[0])];
      return had ? 1 : 0;
    }
    case "ZCARD": {
      const e = get();
      if (!e) return 0;
      if (e.t !== "z") throw wrong();
      return Object.keys(e.v).length;
    }
    case "ZREVRANGE": {
      const e = get();
      if (!e) return [];
      if (e.t !== "z") throw wrong();
      const members = Object.entries(e.v)
        .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? 1 : -1))
        .map(([m]) => m);
      return slice(members, Number(rest[0]), Number(rest[1]));
    }
    case "LPUSH": {
      const e = get() ?? (data[k] = { t: "l", v: [] });
      if (e.t !== "l") throw wrong();
      for (const value of rest) e.v.unshift(String(value));
      return e.v.length;
    }
    case "LTRIM": {
      const e = get();
      if (!e) return "OK";
      if (e.t !== "l") throw wrong();
      e.v = slice(e.v, Number(rest[0]), Number(rest[1]));
      return "OK";
    }
    case "LRANGE": {
      const e = get();
      if (!e) return [];
      if (e.t !== "l") throw wrong();
      return slice(e.v, Number(rest[0]), Number(rest[1]));
    }
    default:
      throw new StoreError(`unsupported command ${op}`);
  }
}

/** Redis' inclusive start/stop, where a negative number counts from the end. */
function slice<T>(list: T[], start: number, stop: number): T[] {
  const n = list.length;
  const from = start < 0 ? Math.max(n + start, 0) : start;
  const to = stop < 0 ? n + stop : Math.min(stop, n - 1);
  return from > to ? [] : list.slice(from, to + 1);
}

// ---------------------------------------------------------------------------------------------------------------------
// file backend
// ---------------------------------------------------------------------------------------------------------------------

function fileStore(path: string): Kv {
  const load = (): Data => {
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Data;
    } catch {
      return {};
    }
  };
  return {
    kind: "file",
    async run(cmds) {
      // read, change and write in one go with no await between, so nothing else in this process can step in
      const data = load();
      const now = Date.now();
      const replies = cmds.map((c) => execute(data, c, now));
      if (cmds.some((c) => !/^(GET|MGET|ZCARD|ZREVRANGE|LRANGE)$/i.test(String(c[0])))) {
        mkdirSync(dirname(path), { recursive: true });
        const temp = `${path}.${process.pid}.tmp`;
        writeFileSync(temp, JSON.stringify(data));
        renameSync(temp, path);
      }
      return replies;
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// Redis over HTTPS (Upstash REST: https://upstash.com/docs/redis/features/restapi)
// ---------------------------------------------------------------------------------------------------------------------

function redisStore(url: string, token: string): Kv {
  const endpoint = `${url.replace(/\/+$/, "")}/pipeline`;
  return {
    kind: "redis",
    async run(cmds) {
      let response: Response;
      try {
        response = await fetch(endpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(cmds),
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        });
      } catch (error) {
        throw new StoreError(`the store could not be reached (${error instanceof Error ? error.message : "unknown"})`);
      }
      if (!response.ok) throw new StoreError(`the store answered ${response.status}`);
      const body = (await response.json().catch(() => null)) as { result?: Reply; error?: string }[] | null;
      if (!Array.isArray(body) || body.length !== cmds.length) throw new StoreError("the store sent an answer that was not understood");
      return body.map((r) => {
        if (r.error) throw new StoreError(r.error);
        return r.result ?? null;
      });
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------------

let cached: { sig: string; kv: Kv | null } | undefined;

/** The store this server uses, or null when none is set up. */
export function getKv(): Kv | null {
  const env = process.env;
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL || "";
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN || "";
  const file = env.LW_STORE === "file" || (env.NODE_ENV !== "production" && !env.VERCEL);
  const path = env.LW_STORE_PATH || join(process.cwd(), ".data", "store.json");
  const sig = `${url}|${token}|${file}|${path}`;
  if (cached?.sig === sig) return cached.kv;
  const kv = url && token ? redisStore(url, token) : file ? fileStore(path) : null;
  cached = { sig, kv };
  return kv;
}

/** The store's name for the admin pages ("Redis", "a local file") or null. */
export const storeKind = () => getKv()?.kind ?? null;

/** One command. */
export async function cmd(c: Cmd): Promise<Reply> {
  const kv = getKv();
  if (!kv) throw new StoreError("no store is set up");
  return (await kv.run([c]))[0];
}

/** Several commands in one round trip. */
export async function pipe(cmds: Cmd[]): Promise<Reply[]> {
  const kv = getKv();
  if (!kv) throw new StoreError("no store is set up");
  return kv.run(cmds);
}
