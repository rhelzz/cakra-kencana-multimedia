'use client';

import { useState, type FormEvent } from 'react';
import { Lock, MessageCircle, Send } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

export type ServiceOption = { value: string; label: string };

type Props = {
  services: ServiceOption[];
  mailConfigured: boolean;
  waFallback: string | null;
  locale: Locale;
  ui: Record<string, string>;
};

type Fields = {
  name: string;
  company: string;
  email: string;
  phone: string;
  service: string;
  message: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s\-()./]*$/;

const inputClass = (invalid: boolean) =>
  `w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition duration-300 ease-exit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 motion-reduce:transition-none ${
    invalid ? 'border-destructive' : 'border-input'
  }`;

export default function ContactForm({ services, mailConfigured, waFallback, locale, ui }: Props) {
  const [fields, setFields] = useState<Fields>({
    name: '',
    company: '',
    email: '',
    phone: '',
    service: '',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'failed'>('idle');
  const [failedMessage, setFailedMessage] = useState('');

  const set = (key: keyof Fields) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  function validate(f: Fields): Partial<Record<keyof Fields, string>> {
    const next: Partial<Record<keyof Fields, string>> = {};
    const name = f.name.trim();
    if (name.length < 2 || name.length > 100) next.name = ui.contactFormErrorName;
    if (!EMAIL_RE.test(f.email.trim())) next.email = ui.contactFormErrorEmail;
    const phone = f.phone.trim();
    if (phone && (phone.length > 50 || !PHONE_RE.test(phone)))
      next.phone = ui.contactFormErrorPhone;
    if (f.company.trim().length > 100) next.company = ui.contactFormErrorCompany;
    if (!services.some((s) => s.value === f.service)) next.service = ui.contactFormErrorService;
    const message = f.message.trim();
    if (message.length < 10 || message.length > 2000)
      next.message = ui.contactFormErrorMessage;
    return next;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!mailConfigured || status === 'sending') return;
    const found = validate(fields);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setStatus('sending');
    setFailedMessage('');
    try {
      // Honeypot value comes from the live DOM — a bot-filled field must reach
      // the server for the trap to work; hardcoding '' would disarm it.
      const trap = new FormData(e.currentTarget).get('website');
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fields.name.trim(),
          company: fields.company.trim(),
          email: fields.email.trim(),
          phone: fields.phone.trim(),
          service: fields.service,
          message: fields.message.trim(),
          locale,
          // Honeypot — real visitors leave it empty; bots tend to fill every field.
          website: typeof trap === 'string' ? trap : '',
        }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (res.ok && data?.ok) {
        setStatus('success');
        setFields({ name: '', company: '', email: '', phone: '', service: '', message: '' });
      } else {
        setStatus('failed');
        setFailedMessage(
          data?.error === 'not-configured'
            ? ui.contactFormNotConfigured
            : ui.contactFormSendFailed,
        );
      }
    } catch {
      // Network failure — no detail to show beyond the generic message.
      setStatus('failed');
      setFailedMessage(ui.contactFormSendFailed);
    }
  }

  if (status === 'success') {
    return (
      <div
        role="status"
        className="rounded-md border border-border bg-muted/50 p-6 text-center"
      >
        <p className="text-sm font-medium text-foreground">{ui.contactFormSuccess}</p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition duration-300 ease-settle hover:border-primary/50 hover:text-primary active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          {ui.contactFormSend}
        </button>
      </div>
    );
  }

  const optional = (label: string) => (
    <span className="ml-1.5 font-normal normal-case tracking-normal text-muted-foreground">
      ({label})
    </span>
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      {!mailConfigured && (
        <div
          role="status"
          className="mb-6 rounded-md border border-border bg-muted/50 p-4"
        >
          <p className="text-sm text-muted-foreground">{ui.contactFormNotConfigured}</p>
          {waFallback && (
            <a
              href={waFallback}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition duration-500 ease-settle hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 motion-reduce:transition-none"
            >
              <MessageCircle className="size-4" />
              {ui.contactFormWhatsapp}
            </a>
          )}
        </div>
      )}

      {status === 'failed' && failedMessage && (
        <p role="alert" className="mb-6 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {failedMessage}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-foreground">
            {ui.contactFormName}
            <span aria-hidden className="ml-1 text-destructive">*</span>
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            aria-required="true"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'contact-name-error' : undefined}
            value={fields.name}
            onChange={set('name')}
            className={inputClass(Boolean(errors.name))}
          />
          {errors.name && (
            <p id="contact-name-error" role="alert" className="mt-1.5 text-xs text-destructive">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="contact-company" className="mb-1.5 block text-sm font-medium text-foreground">
            {ui.contactFormCompany}
            {optional(ui.contactFormOptional)}
          </label>
          <input
            id="contact-company"
            name="company"
            type="text"
            autoComplete="organization"
            aria-invalid={Boolean(errors.company)}
            aria-describedby={errors.company ? 'contact-company-error' : undefined}
            value={fields.company}
            onChange={set('company')}
            className={inputClass(Boolean(errors.company))}
          />
          {errors.company && (
            <p id="contact-company-error" role="alert" className="mt-1.5 text-xs text-destructive">
              {errors.company}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-foreground">
            {ui.contactFormEmail}
            <span aria-hidden className="ml-1 text-destructive">*</span>
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            aria-required="true"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            value={fields.email}
            onChange={set('email')}
            className={inputClass(Boolean(errors.email))}
          />
          {errors.email && (
            <p id="contact-email-error" role="alert" className="mt-1.5 text-xs text-destructive">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="contact-phone" className="mb-1.5 block text-sm font-medium text-foreground">
            {ui.contactFormPhone}
            {optional(ui.contactFormOptional)}
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'contact-phone-error' : undefined}
            value={fields.phone}
            onChange={set('phone')}
            className={inputClass(Boolean(errors.phone))}
          />
          {errors.phone && (
            <p id="contact-phone-error" role="alert" className="mt-1.5 text-xs text-destructive">
              {errors.phone}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="contact-service" className="mb-1.5 block text-sm font-medium text-foreground">
            {ui.contactFormService}
            <span aria-hidden className="ml-1 text-destructive">*</span>
          </label>
          <select
            id="contact-service"
            name="service"
            aria-required="true"
            aria-invalid={Boolean(errors.service)}
            aria-describedby={errors.service ? 'contact-service-error' : undefined}
            value={fields.service}
            onChange={set('service')}
            className={inputClass(Boolean(errors.service))}
          >
            <option value="">{ui.contactFormSelectService}</option>
            {services.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {errors.service && (
            <p id="contact-service-error" role="alert" className="mt-1.5 text-xs text-destructive">
              {errors.service}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-foreground">
            {ui.contactFormMessage}
            <span aria-hidden className="ml-1 text-destructive">*</span>
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={5}
            aria-required="true"
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? 'contact-message-error' : undefined}
            value={fields.message}
            onChange={set('message')}
            className={`${inputClass(Boolean(errors.message))} resize-y`}
          />
          {errors.message && (
            <p id="contact-message-error" role="alert" className="mt-1.5 text-xs text-destructive">
              {errors.message}
            </p>
          )}
        </div>
      </div>

      {/* Honeypot: hidden from sighted users and assistive tech alike. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
        defaultValue=""
      />

      <button
        type="submit"
        disabled={!mailConfigured || status === 'sending'}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition duration-500 ease-settle hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none motion-reduce:transition-none"
      >
        <Send className="size-4" />
        {status === 'sending' ? ui.contactFormSending : ui.contactFormSend}
      </button>

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <Lock aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        {ui.contactFormPrivacy}
      </p>
    </form>
  );
}
