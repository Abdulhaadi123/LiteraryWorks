import { PageHero } from "@/components/ui";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "Privacy notice",
  "What LiteraryWorks collects through this website, why, who processes it and how to reach us.",
  "/privacy",
);

// Plain-language notice for the contact form only. Have counsel review it, and add the business's legal name and
// contact details, before the site goes live.
export default function PrivacyPage() {
  return (
    <>
      <PageHero kicker="Legal" title="Privacy notice" lead="Last updated: November 2026. This notice explains what this website collects and why." />
      <section className="section on-white">
        <div className="wrap-narrow prose">
          <h2>What we collect</h2>
          <p>
            When you send a message through the contact form we collect the details you choose to give us: your name, work email, company, what you need help with, and your message. We do not ask for passwords, payment details or other sensitive information, and we ask that you do not send any.
          </p>
          <h2>How we use it</h2>
          <p>
            We use these details to reply to you, to arrange a call, and to assess whether and how we can help. We do not sell them, and we do not use them for advertising.
          </p>
          <h2>Who processes it</h2>
          <p>
            Messages are delivered to us by an email delivery provider (Twilio SendGrid), which also sends you a short confirmation that we received your message, and this website is delivered by a hosting provider. They process data on our behalf to provide those services, and the hosting provider may keep ordinary technical logs, such as IP addresses and pages requested, for security and reliability.
          </p>
          <h2>The website assistant</h2>
          <p>
            The assistant in the corner of each page answers questions about our services. What you type in it is sent to OpenAI, which generates the answer on our behalf; we ask OpenAI not to store it, and we do not keep chat conversations ourselves. The conversation stays in your browser tab until you close it or start a new one. If you ask us to contact you from the assistant, the conversation is sent to us with your details, so we can reply with the context. Please do not type sensitive personal information into it.
          </p>
          <h2>How long we keep it</h2>
          <p>We keep inquiries for as long as needed to answer them and to follow up, and then delete them.</p>
          <h2>Cookies</h2>
          <p>This website does not set advertising or tracking cookies of its own.</p>
          <h2>The map</h2>
          <p>
            The contact page shows our location on an embedded Google Map. It loads only when you scroll to it; when it does, Google receives your
            browser&apos;s request (including your IP address) and may set its own cookies, under Google&apos;s privacy policy.
          </p>
          <h2>Your choices</h2>
          <p>
            You can ask us to tell you what we hold about you, to correct it, or to delete it. Send a message through the contact form and mention that it is a privacy request.
          </p>
        </div>
      </section>
    </>
  );
}
