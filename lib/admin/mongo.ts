import { StoreError, type Cmd, type Kv, type Reply } from "./store-types";

/**
 * The admin area's store on MongoDB (Atlas). The rest of the admin code speaks a small set of Redis-style commands
 * (see kv.ts); this runs the same commands on MongoDB, so nothing else changes whichever store is used.
 *
 *   collection `inquiries`  one document per message, its fields at the top level, _id = the message's id
 *                           (open it in Atlas: name, email, company, interest, message, status, note, ...)
 *   collection `kv`         everything else, by type:
 *                             t "s"/"j"  a value (text, or a JSON object kept as a real document under `d`), `x` = when it expires
 *                             t "c"      a counter (`n`), `x` = when it expires
 *                             t "zm"     one member of a sorted set (k = the set, m = member, s = score)
 *                             t "li"     one item of a list (k = the list, at = order, v = value)
 *
 * Commands run one after another, like a Redis pipeline. A compare-and-set is a unique _id (a duplicate key means the
 * value was already there). Expired documents are ignored when read, and a TTL index removes them within a minute.
 */

type Doc = Record<string, unknown>;

/** The part of the driver's Collection this file uses (so a stand-in can be tested against it). */
export interface Coll {
  findOne(filter: Doc): Promise<Doc | null>;
  find(filter: Doc): { sort(s: Doc): { skip(n: number): { limit(n: number): { toArray(): Promise<Doc[]> } } } };
  insertOne(doc: Doc): Promise<unknown>;
  replaceOne(filter: Doc, doc: Doc, options?: { upsert?: boolean }): Promise<unknown>;
  updateOne(filter: Doc, update: Doc, options?: { upsert?: boolean }): Promise<{ matchedCount: number; upsertedCount: number }>;
  findOneAndUpdate(filter: Doc, update: Doc, options: { upsert?: boolean; returnDocument: "after" }): Promise<Doc | null>;
  deleteOne(filter: Doc): Promise<{ deletedCount: number }>;
  deleteMany(filter: Doc): Promise<{ deletedCount: number }>;
  countDocuments(filter: Doc): Promise<number>;
  createIndex?(spec: Doc, options?: Doc): Promise<unknown>;
}
export interface Db {
  collection(name: string): Coll;
}

const INQUIRY = "lw:inq:";
const INQUIRY_INDEX = "lw:inq:index";
const SEP = "\u0000";
const isInquiryKey = (key: string) => key.startsWith(INQUIRY) && key !== INQUIRY_INDEX;

const duplicate = (error: unknown) => !!error && typeof error === "object" && (error as { code?: number }).code === 11000;
const live = (doc: Doc | null, now: number): doc is Doc => !!doc && (doc.x === undefined || doc.x === null || (doc.x as Date).getTime() > now);

/** A JSON object's text, or null when the text is anything else. */
function asObject(text: string): Doc | null {
  if (text[0] !== "{") return null;
  try {
    const v = JSON.parse(text);
    return v && typeof v === "object" && !Array.isArray(v) && !("_id" in v) ? (v as Doc) : null;
  } catch {
    return null;
  }
}

/** Redis' inclusive start/stop (negative counts from the end) as a skip and a count; null when the range is empty. */
function span(start: number, stop: number, total: number): { skip: number; count: number } | null {
  const from = start < 0 ? Math.max(total + start, 0) : start;
  const to = stop < 0 ? total + stop : Math.min(stop, total - 1);
  return from > to ? null : { skip: from, count: to - from + 1 };
}

let sequence = 0;

export function createMongoKv(getDb: () => Promise<Db>): Kv {
  let ready: Promise<void> | undefined;
  const colls = async () => {
    const db = await getDb();
    const kv = db.collection("kv");
    const inquiries = db.collection("inquiries");
    ready ??= (async () => {
      // best effort: the store works without these, only slower or with expired documents lingering a little
      await Promise.allSettled([
        kv.createIndex?.({ x: 1 }, { expireAfterSeconds: 0 }),
        kv.createIndex?.({ t: 1, k: 1, s: -1 }),
        kv.createIndex?.({ t: 1, k: 1, at: -1 }),
        inquiries.createIndex?.({ createdAt: -1 }),
      ]);
    })();
    await ready;
    return { kv, inquiries };
  };

  async function exec(cmd: Cmd): Promise<Reply> {
    const { kv, inquiries } = await colls();
    const [name, key, ...rest] = cmd;
    const op = String(name).toUpperCase();
    const k = String(key ?? "");
    const now = Date.now();
    const inq = isInquiryKey(k);
    const coll = inq ? inquiries : kv;
    const id = inq ? k.slice(INQUIRY.length) : k;

    const text = (doc: Doc): string => {
      if (doc.t === "j") return JSON.stringify(doc.d);
      if (doc.t === "s") return String(doc.v);
      if (inq) {
        const { _id, ...fields } = doc;
        void _id;
        return JSON.stringify(fields);
      }
      return String(doc.v ?? "");
    };

    switch (op) {
      case "GET": {
        const doc = await coll.findOne({ _id: id });
        if (!live(doc, now)) return null;
        return doc.t === "c" ? String(doc.n) : text(doc);
      }
      case "MGET": {
        const out: (string | null)[] = [];
        for (const name of [k, ...rest].map(String)) {
          const i = isInquiryKey(name);
          const doc = await (i ? inquiries : kv).findOne({ _id: i ? name.slice(INQUIRY.length) : name });
          out.push(live(doc, now) && doc.t !== "c" ? text(doc) : null);
        }
        return out;
      }
      case "SET": {
        const [value, ...flags] = rest;
        let ttl = 0;
        let nx = false;
        for (let n = 0; n < flags.length; n++) {
          const f = String(flags[n]).toUpperCase();
          if (f === "EX") ttl = Number(flags[++n]);
          else if (f === "NX") nx = true;
        }
        const body = String(value);
        const obj = asObject(body);
        let doc: Doc;
        if (inq && obj) doc = { _id: id, ...obj };
        else if (obj) doc = { _id: id, t: "j", d: obj };
        else doc = { _id: id, t: "s", v: body };
        if (!inq && ttl > 0) doc.x = new Date(now + ttl * 1000);
        if (nx) {
          await coll.deleteOne({ _id: id, x: { $lte: new Date(now) } });
          try {
            await coll.insertOne(doc);
          } catch (error) {
            if (duplicate(error)) return null;
            throw error;
          }
          return "OK";
        }
        await coll.replaceOne({ _id: id }, doc, { upsert: true });
        return "OK";
      }
      case "DEL": {
        let n = 0;
        for (const name of [k, ...rest].map(String)) {
          const i = isInquiryKey(name);
          n += (await (i ? inquiries : kv).deleteOne({ _id: i ? name.slice(INQUIRY.length) : name })).deletedCount;
        }
        return n;
      }
      case "INCR": {
        await kv.deleteOne({ _id: k, x: { $lte: new Date(now) } });
        const bump = () => kv.findOneAndUpdate({ _id: k }, { $inc: { n: 1 }, $setOnInsert: { t: "c" } }, { upsert: true, returnDocument: "after" });
        let doc: Doc | null;
        try {
          doc = await bump();
        } catch (error) {
          if (!duplicate(error)) throw error;
          doc = await bump(); // two first increments met: the second now finds the first's document
        }
        return Number(doc?.n ?? 1);
      }
      case "EXPIRE": {
        const nx = String(rest[1] ?? "").toUpperCase() === "NX";
        const res = await kv.updateOne({ _id: k, ...(nx ? { x: { $exists: false } } : {}) }, { $set: { x: new Date(now + Number(rest[0]) * 1000) } });
        return res.matchedCount;
      }
      case "ZADD": {
        const res = await kv.updateOne({ _id: `${k}${SEP}${rest[1]}` }, { $set: { t: "zm", k, m: String(rest[1]), s: Number(rest[0]) } }, { upsert: true });
        return res.upsertedCount;
      }
      case "ZREM":
        return (await kv.deleteOne({ _id: `${k}${SEP}${rest[0]}` })).deletedCount;
      case "ZCARD":
        return kv.countDocuments({ t: "zm", k });
      case "ZREVRANGE": {
        const w = span(Number(rest[0]), Number(rest[1]), await kv.countDocuments({ t: "zm", k }));
        if (!w) return [];
        const docs = await kv.find({ t: "zm", k }).sort({ s: -1, m: -1 }).skip(w.skip).limit(w.count).toArray();
        return docs.map((d) => String(d.m));
      }
      case "LPUSH": {
        for (const value of rest) {
          // `at` orders the list: the time, then a counter for items pushed in the same millisecond
          const at = now * 1000 + (sequence++ % 1000);
          await kv.insertOne({ _id: `${k}${SEP}${at}${SEP}${Math.random().toString(36).slice(2, 8)}`, t: "li", k, at, v: String(value) });
        }
        return kv.countDocuments({ t: "li", k });
      }
      case "LTRIM": {
        if (Number(rest[0]) !== 0 || Number(rest[1]) < 0) throw new StoreError("LTRIM keeps the newest items only");
        const keep = Number(rest[1]) + 1;
        const [oldest] = await kv.find({ t: "li", k }).sort({ at: -1 }).skip(keep).limit(1).toArray();
        if (oldest) await kv.deleteMany({ t: "li", k, at: { $lte: oldest.at } });
        return "OK";
      }
      case "LRANGE": {
        const w = span(Number(rest[0]), Number(rest[1]), await kv.countDocuments({ t: "li", k }));
        if (!w) return [];
        const docs = await kv.find({ t: "li", k }).sort({ at: -1 }).skip(w.skip).limit(w.count).toArray();
        return docs.map((d) => String(d.v));
      }
      default:
        throw new StoreError(`unsupported command ${op}`);
    }
  }

  return {
    kind: "mongo",
    async run(cmds) {
      const out: Reply[] = [];
      try {
        for (const c of cmds) out.push(await exec(c));
      } catch (error) {
        if (error instanceof StoreError) throw error;
        // the driver's messages can name the host; keep them out of the answer
        throw new StoreError(`the database did not answer (${error instanceof Error ? error.name : "error"})`);
      }
      return out;
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// the connection: one client for the whole server process (and, on a serverless host, for every request one instance serves)
// ---------------------------------------------------------------------------------------------------------------------

const globalForMongo = globalThis as unknown as { __lwMongo?: Promise<Db> };

/** The database name: MONGODB_DB, else the one in the connection string, else "literaryworx". */
export function databaseName(uri: string, override?: string): string {
  if (override?.trim()) return override.trim();
  const m = /^mongodb(?:\+srv)?:\/\/[^/?]+\/([^?]+)/.exec(uri);
  return m && decodeURIComponent(m[1]) ? decodeURIComponent(m[1]) : "literaryworx";
}

export function connectMongo(uri: string, override?: string): Promise<Db> {
  globalForMongo.__lwMongo ??= (async () => {
    // loaded only when MongoDB is the store, so the other stores never pay for the driver
    const { MongoClient } = await import("mongodb");
    const client = new MongoClient(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 8000, connectTimeoutMS: 8000, appName: "literaryworx-site" });
    await client.connect();
    return client.db(databaseName(uri, override)) as unknown as Db;
  })().catch((error) => {
    // a failed connection must not be remembered, or every later request would fail the same way
    globalForMongo.__lwMongo = undefined;
    throw error;
  });
  return globalForMongo.__lwMongo;
}
