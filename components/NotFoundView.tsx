import Link from "next/link";
import { PageHero } from "@/components/ui";

/** The 404 page's content. Two files use it: the one for an address that matches nothing (it brings its own frame) and the one for a page that is missing inside the site (the site layout is already there). */
export function NotFoundView() {
  return (
    <PageHero
      kicker="404"
      title={
        <>
          This page is <em>not here</em>
        </>
      }
      lead="The address may be wrong, or the page may have moved. These will get you back on track."
    >
      <Link className="btn btn-navy" href="/">
        Go home
      </Link>
      <Link className="btn btn-line" href="/services">
        Our services
      </Link>
    </PageHero>
  );
}
