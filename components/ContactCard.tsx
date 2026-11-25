import { versioned } from "@/lib/assets";
import { company, location } from "@/lib/content";

/** "Talk to a person": a photo and the three ways to reach us (phone, e-mail, the office), on the contact page. */
export function ContactCard() {
  return (
    <div className="contact-card" data-reveal>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="contact-card-photo"
        src={versioned("/contact/talk-320.webp")}
        srcSet={`${versioned("/contact/talk-320.webp")} 320w, ${versioned("/contact/talk.webp")} 640w`}
        sizes="104px"
        width={320}
        height={320}
        alt="A smiling man in a green plaid shirt"
        loading="lazy"
        decoding="async"
      />
      <div className="contact-card-body">
        <p className="contact-card-kicker">Talk to a person</p>
        <ul>
          <li>
            <span>Call</span>
            <a href={company.phoneHref}>{company.phone}</a>
          </li>
          <li>
            <span>Write</span>
            <a href={`mailto:${company.email}`}>{company.email}</a>
          </li>
          <li>
            <span>Visit</span>
            <a href={location.mapLink} target="_blank" rel="noopener noreferrer">
              {location.street}, {location.city}, {location.regionCode} {location.postalCode}
              <span className="sr-only"> (opens Google Maps in a new tab)</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
