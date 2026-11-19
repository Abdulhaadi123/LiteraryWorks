import Link from "next/link";

export default function NotFound() {
  return (
    <section className="relative flex min-h-[70vh] items-center justify-center border-b border-slate-200/80 bg-white px-6 py-24 text-center">
      <div className="mx-auto max-w-md">
        <span className="font-mono text-5xl font-extrabold text-[#b48d55]">404</span>
        <h1 className="mt-4 mb-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Page Not Found
        </h1>
        <p className="mb-8 text-sm text-slate-600">
          The requested system node or route does not exist in this operational environment.
        </p>
        <Link
          href="/"
          className="inline-flex min-h-[48px] items-center justify-center gap-3 rounded-lg bg-[#0f2438] px-7 font-display text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#1a3854]"
        >
          Return to Overview <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  );
}
