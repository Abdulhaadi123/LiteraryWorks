/**
 * The LiteraryWorks mark: a navy "L" that holds a green "W", built from the same bold, flat strokes as the brand
 * guide's monogram. The wordmark is live text (two lines, like the guide's lockup), so it stays sharp and readable.
 */
export function Mark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path className="mk-l" d="M8 6h15v73h73v15H8z" />
      <path className="mk-w" d="M28.5 24h15l17 44h-15zM45.5 68l9-24h15l-9 24zM54.5 44h15l9 24h-15zM63.5 68l17-44h15l-17 44z" />
    </svg>
  );
}

export function Logo({ tone = "color" }: { tone?: "color" | "light" }) {
  return (
    <span className={`logo logo-${tone}`}>
      <Mark className="logo-mark" />
      <span className="logo-word">
        <b>Literary</b>
        <b>Works</b>
      </span>
    </span>
  );
}
