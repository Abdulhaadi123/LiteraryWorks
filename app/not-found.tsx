import Link from "next/link";
import { PageHero } from "@/components/ui";

export default function NotFound() {
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
