import { NextResponse } from "next/server";

type Inquiry = {name: string; email: string; company: string; interest: string; message: string; website?: string};

const allowedInterests = new Set(["AI Agents & Automation", "Custom Software & SaaS", "Enterprise AI & Integrations", "Cloud & Platform Engineering", "Web & Mobile Experiences", "AI Strategy & Advisory", "Construction & Project Solutions", "Something else"]);
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max + 1) : "";

export async function POST(request: Request) {
  let input: Record<string, unknown>;
  try {input = await request.json();} catch {return NextResponse.json({message: "Please provide a valid inquiry."}, {status: 400});}
  if (!input || typeof input !== "object" || Array.isArray(input)) return NextResponse.json({message: "Please provide a valid inquiry."}, {status: 400});
  if (clean(input.website, 200)) return NextResponse.json({message: "Thank you."}, {status: 200}); // honeypot: do not deliver spam
  const inquiry: Inquiry = {
    name: clean(input.name, 120), email: clean(input.email, 254), company: clean(input.company, 120),
    interest: clean(input.interest, 80), message: clean(input.message, 5000)
  };
  if (inquiry.name.length < 2 || inquiry.name.length > 120 || !emailRe.test(inquiry.email) || inquiry.email.length > 254 || inquiry.company.length > 120 || !allowedInterests.has(inquiry.interest) || inquiry.message.length < 10 || inquiry.message.length > 5000) {
    return NextResponse.json({message: "Please complete all required fields with valid information."}, {status: 400});
  }
  const {RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL} = process.env;
  if (!RESEND_API_KEY || !CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL) {
    return NextResponse.json({message: "Our inquiry inbox is not yet configured. Please try again after launch."}, {status: 503});
  }
  // Render untrusted user text as plain text rather than HTML to prevent injection.
  const body = `New LiteraryWorks project inquiry\n\nName: ${inquiry.name}\nEmail: ${inquiry.email}\nCompany: ${inquiry.company || "Not provided"}\nInterest: ${inquiry.interest}\n\nProject description:\n${inquiry.message}`;
  try {
    const response = await fetch("https://api.resend.com/emails", {method: "POST", headers: {Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json"}, body: JSON.stringify({from: CONTACT_FROM_EMAIL, to: [CONTACT_TO_EMAIL], subject: `LiteraryWorks inquiry — ${inquiry.interest}`, text: body, reply_to: inquiry.email}), cache: "no-store"});
    if (!response.ok) return NextResponse.json({message: "We couldn't deliver your inquiry. Please try again later."}, {status: 502});
    return NextResponse.json({message: "Inquiry sent."}, {status: 200});
  } catch {return NextResponse.json({message: "We couldn't reach our email service. Please try again later."}, {status: 502});}
}
