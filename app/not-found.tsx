import Link from "next/link";

export default function NotFound() {
  return (
    <section className="relative flex min-h-[70vh] items-center justify-center border-b border-white/10 bg-[#060911] px-6 py-24 text-center">
      <div className="mx-auto max-w-md">
        <span className="font-mono text-5xl font-extrabold text-[#ff6b00]">404</span>
        <h1 className="mt-4 mb-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Endpoint Not Found
        </h1>
        <p className="mb-8 text-sm text-slate-400">
          The requested system node or route does not exist in this operational environment.
        </p>
        <Link
          href="/"
          className="inline-flex min-h-[48px] items-center justify-center gap-3 rounded-md bg-[#ff6b00] px-7 font-display text-xs font-bold text-black shadow-[0_0_20px_rgba(255,107,0,0.25)] transition-all hover:bg-[#ff8c33]"
        >
          Return to Mission Control <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  );
}
