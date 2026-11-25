import { NotFoundView } from "@/components/NotFoundView";
import { SiteChrome } from "@/components/SiteChrome";

/** An address that matches no page at all: the root layout is only the document, so this brings the site's frame itself. */
export default function NotFound() {
  return (
    <SiteChrome>
      <NotFoundView />
    </SiteChrome>
  );
}
