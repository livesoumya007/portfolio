import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s\-().]{6,19}$/;
const HAS_NEWLINE_RE = /[\r\n]/;

const MAX_LEN = {
  name: 100,
  email: 254,
  phone: 30,
  message: 5000,
} as const;

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  message?: unknown;
  company?: unknown; // honeypot field — real visitors never fill this in
};

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL ?? 'onboarding@resend.dev';

  if (!apiKey || !toEmail) {
    console.error('Contact API misconfigured: missing RESEND_API_KEY or CONTACT_EMAIL env var.');
    return NextResponse.json(
      { error: 'The contact form is temporarily unavailable. Please email me directly.' },
      { status: 500 }
    );
  }

  let body: ContactPayload;
  try {
    body = await request.json();
  } catch {
    return badRequest('Invalid request body.');
  }

  // Honeypot: bots tend to fill in every field they find. A real visitor never
  // sees or fills this one (it's hidden off-screen in the form). If it's
  // populated, silently report success so the bot doesn't retry.
  if (asTrimmedString(body.company) !== '') {
    return NextResponse.json({ success: true });
  }

  const name = asTrimmedString(body.name);
  const email = asTrimmedString(body.email);
  const phone = asTrimmedString(body.phone);
  const message = asTrimmedString(body.message);

  if (!name || name.length < 2) return badRequest('Please provide a valid name.');
  if (!email || !EMAIL_RE.test(email)) return badRequest('Please provide a valid email address.');
  if (!phone || !PHONE_RE.test(phone)) return badRequest('Please provide a valid phone number.');
  if (!message || message.length < 10) return badRequest('Message must be at least 10 characters.');

  if (
    name.length > MAX_LEN.name ||
    email.length > MAX_LEN.email ||
    phone.length > MAX_LEN.phone ||
    message.length > MAX_LEN.message
  ) {
    return badRequest('One or more fields exceed the allowed length.');
  }

  // Defense against email header injection: name/email/phone end up on
  // single header-like lines (Subject, Reply-To), so raw newlines must
  // never be allowed through, no matter what the mail SDK does internally.
  if (HAS_NEWLINE_RE.test(name) || HAS_NEWLINE_RE.test(email) || HAS_NEWLINE_RE.test(phone)) {
    return badRequest('Invalid characters in submitted data.');
  }

  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      from: `Portfolio Contact Form <${fromEmail}>`,
      to: toEmail,
      replyTo: email,
      subject: `New portfolio message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`,
    });

    if (error) {
      console.error('Resend API error:', error);
      return NextResponse.json(
        { error: 'Failed to send your message. Please try again later.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unexpected error sending contact email:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
}
