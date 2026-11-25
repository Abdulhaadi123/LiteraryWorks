import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="adm-login">
      <div className="adm-login-card">
        <h1>Not found</h1>
        <p className="lead">That page or message does not exist (it may have been deleted).</p>
        <Link className="btn btn-navy" href="/admin/inquiries">
          Back to the inbox
        </Link>
      </div>
    </div>
  );
}
