import nodemailer from 'nodemailer';
import { baseAlias, CATEGORY, getCategory } from '@/lib/joomla';
import { isLocale } from '@/lib/i18n';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s\-()./]*$/;

// ~20KB: far above any honest message (limit is 2000 chars), far below abuse.
const MAX_BODY_BYTES = 20 * 1024;

// In-memory per-IP bucket: 5 submissions per 10 minutes. This resets on restart and
// doesn't span instances — enough to blunt casual form spam on a single VPS, not a
// substitute for a WAF or CAPTCHA if abuse ever gets serious.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_HITS) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

/** Escape the five characters that can break out of an HTML text node/attribute. */
const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

type Payload = {
  name: unknown;
  company: unknown;
  email: unknown;
  phone: unknown;
  service: unknown;
  message: unknown;
  locale: unknown;
  website: unknown;
};

function invalid(reason: string) {
  return Response.json({ ok: false, error: 'invalid', reason }, { status: 400 });
}

export async function POST(req: Request) {
  // Same-origin only: the form posts from our own pages, so a cross-site POST is
  // either CSRF or a bot. curl/health checks send no Origin and stay allowed.
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return Response.json({ ok: false }, { status: 403 });
    } catch {
      return Response.json({ ok: false }, { status: 403 });
    }
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) {
    // 429 with a generic code — the client shows its standard failure message.
    return Response.json({ ok: false, error: 'rate-limited' }, { status: 429 });
  }

  const raw = await req.text().catch(() => '');
  if (!raw || raw.length > MAX_BODY_BYTES) {
    return Response.json({ ok: false, error: 'invalid' }, { status: raw ? 413 : 400 });
  }
  let body: Payload;
  try {
    body = JSON.parse(raw) as Payload;
  } catch {
    return invalid('body');
  }

  // Honeypot: bots fill every field, visitors never see this one — play along
  // with a fake success so the bot can't tell it was ignored.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return Response.json({ ok: true });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const company = typeof body.company === 'string' ? body.company.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const service = typeof body.service === 'string' ? body.service : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const locale = typeof body.locale === 'string' && isLocale(body.locale) ? body.locale : null;

  if (!locale) return invalid('locale');
  if (name.length < 2 || name.length > 100) return invalid('name');
  if (/[\r\n]/.test(name)) return invalid('name');
  if (email.length > 254 || !EMAIL_RE.test(email)) return invalid('email');
  if (company.length > 100) return invalid('company');
  if (phone && (phone.length > 50 || !PHONE_RE.test(phone))) return invalid('phone');
  if (message.length < 10 || message.length > 2000) return invalid('message');

  // The service must be one of the live service aliases — a free-text value here
  // would turn the form into an open mail relay with an attacker-chosen subject line.
  let serviceLabel: string | null = null;
  try {
    const services = await getCategory(CATEGORY.services, locale);
    serviceLabel = services.find((s) => baseAlias(s.attributes.alias) === service)?.attributes.title ?? null;
  } catch {
    return invalid('service');
  }
  if (!serviceLabel) return invalid('service');

  const contactTo = process.env.CONTACT_TO;
  if (!process.env.SMTP_HOST || !contactTo) {
    return Response.json({ ok: false, error: 'not-configured' }, { status: 503 });
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number.isFinite(port) ? port : 587,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });

  // Every user value is escaped before touching the HTML part; the text part needs no
  // escaping. replyTo lets the owner answer the visitor directly from their inbox.
  const lines = [
    `Name: ${name}`,
    company ? `Company: ${company}` : null,
    `Email: ${email}`,
    phone ? `WhatsApp: ${phone}` : null,
    `Service: ${serviceLabel}`,
    `Locale: ${locale}`,
    '',
    message,
  ].filter((l): l is string => l !== null);
  const text = lines.join('\n');
  const html = lines.map((l) => `<p>${escapeHtml(l).replace(/\n/g, '<br>')}</p>`).join('');

  try {
    await transporter.sendMail({
      from: process.env.CONTACT_FROM || process.env.SMTP_USER || contactTo,
      to: contactTo,
      replyTo: email,
      subject: `[Website] ${serviceLabel} — ${name}`,
      text,
      html,
    });
  } catch {
    // Never leak transport details (host/auth errors) to the client, and never log
    // the payload — it contains PII. A single generic line is enough for the owner
    // to correlate with a timestamp in the mail server's own logs.
    console.error('[contact] send failed');
    return Response.json({ ok: false, error: 'send-failed' }, { status: 502 });
  }

  return Response.json({ ok: true });
}
