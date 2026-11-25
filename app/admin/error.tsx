"use client";

/** Anything that goes wrong while an admin page is made (most often: the store cannot be reached) ends here, with no detail shown. */
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="adm-login">
      <div className="adm-login-card">
        <h1>Something went wrong</h1>
        <p className="lead">The admin area could not load this page. The data store may be unreachable for a moment.</p>
        <div className="adm-actions">
          <button type="button" className="btn btn-navy" onClick={reset}>
            Try again
          </button>
          <a className="btn" href="/admin/login">
            Sign-in page
          </a>
        </div>
      </div>
    </div>
  );
}
