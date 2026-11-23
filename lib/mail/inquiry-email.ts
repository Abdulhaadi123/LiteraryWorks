/**
 * The two emails a contact-form message sends: the notice to our team, and a short confirmation to the person who
 * wrote. Each has an HTML version (table layout with inline styles, which is what email clients render reliably) and a
 * plain-text version. Everything the visitor typed is escaped before it goes into HTML.
 *
 * No images, fonts or tracking pixels: the emails look the same with remote content blocked.
 */

export type ChatTurn = { role: "user" | "assistant"; content: string };
export type Inquiry = {
  name: string;
  email: string;
  company: string;
  interest: string;
  message: string;
  /** the website-assistant conversation, when the message was sent from the chat */
  conversation?: ChatTurn[];
};

const NAVY = "#22425f";
const GREEN = "#73c94a";
const INK = "#191716";
const BODY = "#4b5262";
const FAINT = "#6b7280";
const RULE = "#e3e8ee";
const MIST = "#f4f6f7";
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** A value for a subject or a name: one line, no control characters. */
export const oneLine = (s: string) => s.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();

/** The visitor's text as HTML: escaped, line breaks kept. */
const para = (s: string) => escape(s).replace(/\r?\n/g, "<br>");

/** When the message arrived, in the business's own time (San Antonio). */
export function receivedAt(now = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    // (dateStyle/timeStyle cannot be combined with timeZoneName, so the parts are named one by one)
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(now);
}

/** The frame both emails share: a navy band with the wordmark, a white card, a quiet footer. */
function frame({ preheader, body, footer }: { preheader: string; body: string; footer: string }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<title>LiteraryWorks</title>
</head>
<body style="margin:0;padding:0;background:${MIST};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escape(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${MIST};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
        <tr>
          <td style="background:${NAVY};border-radius:14px 14px 0 0;padding:24px 32px;border-bottom:4px solid ${GREEN};">
            <span style="font-family:${FONT};font-size:20px;font-weight:700;letter-spacing:-0.3px;color:#ffffff;">Literary<span style="color:${GREEN};">Works</span></span>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border-radius:0 0 14px 14px;padding:32px;font-family:${FONT};color:${BODY};font-size:15px;line-height:1.6;">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${FAINT};text-align:center;">
            ${footer}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

const row = (label: string, value: string) => `
  <tr>
    <td valign="top" style="padding:10px 0;border-bottom:1px solid ${RULE};width:120px;font-size:12px;font-weight:600;letter-spacing:0.6px;text-transform:uppercase;color:${FAINT};">${label}</td>
    <td valign="top" style="padding:10px 0;border-bottom:1px solid ${RULE};font-size:15px;color:${INK};">${value}</td>
  </tr>`;

const button = (href: string, label: string) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 4px;">
    <tr>
      <td style="background:${GREEN};border-radius:999px;">
        <a href="${escape(href)}" style="display:inline-block;padding:12px 24px;font-family:${FONT};font-size:15px;font-weight:600;color:#10202f;text-decoration:none;">${label}</a>
      </td>
    </tr>
  </table>`;

/** The chat that led to the message, so the team starts with the context. */
function conversationBlock(turns?: ChatTurn[]) {
  if (!turns?.length) return "";
  return `
      <p style="margin:24px 0 8px;font-size:12px;font-weight:600;letter-spacing:0.6px;text-transform:uppercase;color:${FAINT};">Conversation with the website assistant</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:${FONT};">
        ${turns
          .map(
            (t) => `
        <tr>
          <td valign="top" style="padding:8px 12px 8px 0;width:80px;font-size:12px;font-weight:600;color:${t.role === "user" ? NAVY : FAINT};">${t.role === "user" ? "Visitor" : "Assistant"}</td>
          <td valign="top" style="padding:8px 0;border-bottom:1px solid ${RULE};font-size:14px;line-height:1.55;color:${t.role === "user" ? INK : BODY};">${para(t.content)}</td>
        </tr>`,
          )
          .join("")}
      </table>`;
}

/** The notice to our team. Replying goes straight to the visitor (the email's reply-to is theirs). */
export function teamEmail(q: Inquiry, when = receivedAt()) {
  const subject = oneLine(`New inquiry: ${q.interest} from ${q.name}${q.company ? `, ${q.company}` : ""}`).slice(0, 180);
  const html = frame({
    preheader: `${q.name} wrote about ${q.interest}${q.conversation?.length ? " from the website assistant" : ""}.`,
    body: `
      <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:0.8px;text-transform:uppercase;color:${GREEN};">New website inquiry</p>
      <h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;font-weight:700;color:${INK};">${escape(q.interest)}</h1>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:${FONT};">
        ${row("Name", escape(q.name))}
        ${row("Email", `<a href="mailto:${escape(q.email)}" style="color:${NAVY};">${escape(q.email)}</a>`)}
        ${row("Company", q.company ? escape(q.company) : `<span style="color:${FAINT};">Not given</span>`)}
        ${row("Received", escape(when))}
      </table>
      <p style="margin:24px 0 8px;font-size:12px;font-weight:600;letter-spacing:0.6px;text-transform:uppercase;color:${FAINT};">Message</p>
      <div style="padding:16px 18px;background:${MIST};border-left:3px solid ${NAVY};border-radius:6px;font-size:15px;line-height:1.65;color:${INK};">${para(q.message)}</div>
      ${conversationBlock(q.conversation)}
      ${button(`mailto:${q.email}?subject=${encodeURIComponent(`Re: your ${q.interest} inquiry`)}`, `Reply to ${escape(q.name.split(/\s+/)[0] || q.name)}`)}`,
    footer: "Sent by the contact form on the LiteraryWorks website. Reply to this email to answer the sender directly.",
  });
  const text = [
    "New website inquiry",
    "",
    `Interest: ${q.interest}`,
    `Name: ${q.name}`,
    `Email: ${q.email}`,
    `Company: ${q.company || "Not given"}`,
    `Received: ${when}`,
    "",
    "Message:",
    q.message,
    ...(q.conversation?.length
      ? ["", "Conversation with the website assistant:", ...q.conversation.map((t) => `${t.role === "user" ? "Visitor" : "Assistant"}: ${t.content}`)]
      : []),
    "",
    "Reply to this email to answer the sender directly.",
  ].join("\n");
  return { subject, html, text };
}

/**
 * The confirmation to the visitor. It repeats nothing they wrote except their first name (shortened), so the form
 * cannot be used to send someone else a message of the sender's choosing.
 */
export function confirmationEmail(q: Inquiry, contactEmail: string) {
  const first = (q.name.split(/\s+/)[0] || "").replace(/[^\p{L}\p{M}'-]/gu, "").slice(0, 30);
  const hello = first ? `Hi ${first},` : "Hello,";
  const subject = "We have your message | LiteraryWorks";
  const steps = [
    ["Usually within one business day", "We read your message and reply by email to agree a time."],
    ["A working session", "On a call, we look at how the work happens today and what would help most. For the AI audit, this first hour is free."],
    ["A written next step", "You get a short summary of what we found and what we would do first, with no obligation."],
  ];
  const html = frame({
    preheader: "Thanks for getting in touch. Here is what happens next.",
    body: `
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:700;color:${INK};">${escape(hello)}</h1>
      <p style="margin:0 0 16px;">Thank you for writing to LiteraryWorks. Your message about <b style="color:${INK};">${escape(q.interest)}</b> has reached our team.</p>
      <p style="margin:24px 0 8px;font-size:12px;font-weight:600;letter-spacing:0.6px;text-transform:uppercase;color:${FAINT};">What happens next</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:${FONT};">
        ${steps
          .map(
            ([t, d], i) => `
        <tr>
          <td valign="top" style="padding:12px 14px 12px 0;width:28px;">
            <div style="width:28px;height:28px;border-radius:50%;background:${NAVY};color:#ffffff;font-size:13px;font-weight:700;line-height:28px;text-align:center;">${i + 1}</div>
          </td>
          <td valign="top" style="padding:12px 0;border-bottom:1px solid ${RULE};">
            <div style="font-size:15px;font-weight:600;color:${INK};">${t}</div>
            <div style="font-size:14px;color:${BODY};">${d}</div>
          </td>
        </tr>`,
          )
          .join("")}
      </table>
      <p style="margin:24px 0 0;">If anything is urgent, reply to this email or write to <a href="mailto:${escape(contactEmail)}" style="color:${NAVY};">${escape(contactEmail)}</a>.</p>
      <p style="margin:24px 0 0;color:${INK};">The LiteraryWorks team</p>`,
    footer: "You received this because you sent a message through the contact form on the LiteraryWorks website. If that was not you, you can ignore this email.<br>Literary Worx LLC · San Antonio, Texas",
  });
  const text = [
    hello,
    "",
    `Thank you for writing to LiteraryWorks. Your message about ${q.interest} has reached our team.`,
    "",
    "What happens next:",
    ...steps.map(([t, d], i) => `${i + 1}. ${t}: ${d}`),
    "",
    `If anything is urgent, reply to this email or write to ${contactEmail}.`,
    "",
    "The LiteraryWorks team",
    "",
    "--",
    "You received this because you sent a message through the contact form on the LiteraryWorks website. If that was not you, you can ignore this email.",
    "Literary Worx LLC · San Antonio, Texas",
  ].join("\n");
  return { subject, html, text };
}
