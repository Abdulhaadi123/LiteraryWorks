/** The shapes every store backend shares (kv.ts picks the backend; redis, file and MongoDB each implement `Kv`). */

export type Arg = string | number;
export type Cmd = Arg[];
export type Reply = string | number | null | (string | null)[];

export interface Kv {
  readonly kind: "redis" | "file" | "mongo";
  /** Runs the commands in order, as one request; resolves with each command's reply. */
  run(cmds: Cmd[]): Promise<Reply[]>;
}

export class StoreError extends Error {}
