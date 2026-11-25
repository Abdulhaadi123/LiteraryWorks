"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Status = "new" | "read" | "replied" | "archived";
const options: { value: Status; label: string }[] = [
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "replied", label: "Replied" },
  { value: "archived", label: "Archived" },
];

async function send(id: string, method: "PATCH" | "DELETE", body?: object) {
  const res = await fetch(`/api/admin/inquiries/${encodeURIComponent(id)}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    window.location.assign("/admin/login");
    throw new Error("Please sign in again.");
  }
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(j.message || "That did not work. Please try again.");
  }
}

/** What you do with one inquiry: its status, a private note, and deleting it. Opening a new inquiry marks it read. */
export function InquiryPanel({ id, status: initial, note: initialNote, noteMax }: { id: string; status: Status; note: string; noteMax: number }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initial);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(initialNote);
  const [savedNote, setSavedNote] = useState(initialNote);
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const marked = useRef(false);

  // looking at a new message is reading it
  useEffect(() => {
    if (initial !== "new" || marked.current) return;
    marked.current = true;
    send(id, "PATCH", { status: "read" })
      .then(() => {
        setStatus("read");
        router.refresh();
      })
      .catch(() => {});
  }, [id, initial, router]);

  async function choose(next: Status) {
    if (next === status || busy) return;
    setBusy(true);
    setError("");
    try {
      await send(id, "PATCH", { status: next });
      setStatus(next);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That did not work.");
    }
    setBusy(false);
  }

  async function saveNote() {
    setBusy(true);
    setError("");
    try {
      await send(id, "PATCH", { note });
      setSavedNote(note);
      setFlash("Saved");
      window.setTimeout(() => setFlash(""), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That did not work.");
    }
    setBusy(false);
  }

  async function remove() {
    setBusy(true);
    setError("");
    try {
      await send(id, "DELETE");
      dialog.current?.close();
      router.replace("/admin/inquiries");
      router.refresh();
    } catch (e) {
      dialog.current?.close();
      setError(e instanceof Error ? e.message : "That did not work.");
      setBusy(false);
    }
  }

  return (
    <>
      <section className="adm-panel" aria-labelledby="h-status">
        <header>
          <h2 id="h-status">Status</h2>
        </header>
        <div className="adm-panel-body">
          <div className="adm-segment" role="group" aria-label="Status">
            {options.map((o) => (
              <button key={o.value} type="button" aria-pressed={status === o.value} disabled={busy} onClick={() => choose(o.value)}>
                <span className={`adm-status ${o.value}`} style={{ color: "inherit" }}>
                  {o.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="adm-panel" aria-labelledby="h-note">
        <header>
          <h2 id="h-note">Private note</h2>
          <p>Only you see this</p>
        </header>
        <div className="adm-panel-body">
          <label className="sr-only" htmlFor="note">
            Private note
          </label>
          <textarea id="note" className="textarea" value={note} maxLength={noteMax} onChange={(e) => setNote(e.target.value)} placeholder="Next step, what was agreed, a phone number…" />
          <div className="adm-row">
            <button type="button" className="btn btn-sm btn-navy" disabled={busy || note === savedNote} onClick={saveNote}>
              Save note
            </button>
            <span className="adm-saved" role="status">
              {flash}
            </span>
          </div>
        </div>
      </section>

      {error ? (
        <p className="adm-error" role="alert">
          <span>{error}</span>
        </p>
      ) : null}

      <div>
        <button type="button" className="btn btn-sm btn-danger" onClick={() => dialog.current?.showModal()} disabled={busy}>
          Delete this message
        </button>
      </div>

      <dialog ref={dialog} className="adm-dialog" aria-labelledby="d-title">
        <h2 id="d-title">Delete this message?</h2>
        <p>It is removed from the inbox for good and cannot be brought back. (Export a CSV first if you want a copy.)</p>
        <div className="adm-row">
          <button type="button" className="btn" onClick={() => dialog.current?.close()}>
            Keep it
          </button>
          <button type="button" className="btn btn-solid-danger" onClick={remove} disabled={busy}>
            Delete for good
          </button>
        </div>
      </dialog>
    </>
  );
}
