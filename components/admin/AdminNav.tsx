"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const icon = {
  overview: <path d="M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6v-9h-6v9zm0-16v5h6V4h-6z" />,
  inbox: <path d="M4 5h16l1 9v5H3v-5l1-9zm1.7 2L5 13h4.2l.8 2h4l.8-2H19l-.7-6H5.7z" />,
  security: <path d="M12 2l8 3v6c0 5-3.4 9.2-8 11-4.6-1.8-8-6-8-11V5l8-3zm-1 13l6-6-1.4-1.4L11 12.2 8.4 9.6 7 11l4 4z" />,
};

const items = [
  { href: "/admin", label: "Overview", icon: icon.overview, exact: true },
  { href: "/admin/inquiries", label: "Inquiries", icon: icon.inbox, exact: false },
  { href: "/admin/security", label: "Security", icon: icon.security, exact: false },
];

/** The side bar's links (a bar across the top on a small screen). The current page is marked for the eye and for assistive technology. */
export function AdminNav({ fresh }: { fresh: number }) {
  const path = usePathname();
  return (
    <nav className="adm-nav" aria-label="Admin">
      {items.map((item) => {
        const here = item.exact ? path === item.href : path === item.href || path.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} aria-current={here ? "page" : undefined} prefetch={false}>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              {item.icon}
            </svg>
            {item.label}
            {item.href === "/admin/inquiries" && fresh > 0 ? (
              <span className="adm-badge">
                {fresh}
                <span className="sr-only"> new</span>
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
