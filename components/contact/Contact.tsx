'use client';

import { useState, type FormEvent } from 'react';
import {
  IconMailOpened,
  IconPhoneCall,
  IconBrandGithub,
  IconBrandLinkedin,
} from '@tabler/icons-react';
import { FadeUp } from '@/components/ui/FadeUp';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { CTA } from '@/components/ui/CTA';
import { PROFILE } from '@/lib/profile';
import styles from './Contact.module.css';

const KICKER = 'Contact';
const HEADING = 'Get in touch';
const INTRO =
  'Have a project in mind, a role to discuss, or just want to say hello? Please drop a message';

const SOCIAL_LINKS = [
  {
    icon: IconMailOpened,
    label: 'Email',
    href: 'mailto:livesoumya007@gmail.com',
    tooltip: 'livesoumya007@gmail.com',
    external: false,
  },
  {
    icon: IconPhoneCall,
    label: 'Phone',
    href: 'tel:+918917392388',
    tooltip: '+91 89173 92388',
    external: false,
  },
  {
    icon: IconBrandGithub,
    label: 'GitHub',
    href: PROFILE.github,
    tooltip: undefined,
    external: true,
  },
  {
    icon: IconBrandLinkedin,
    label: 'LinkedIn',
    href: PROFILE.linkedin,
    tooltip: undefined,
    external: true,
  },
] as const;


const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s\-().]{6,19}$/;

type FormState = {
  name: string;
  email: string;
  phone: string;
  message: string;
  company: string; // honeypot — must stay empty; hidden from real visitors
};

type TouchState = {
  name: boolean;
  email: boolean;
  phone: boolean;
  message: boolean;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMPTY: FormState = { name: '', email: '', phone: '', message: '', company: '' };
const UNTOUCHED: TouchState = { name: false, email: false, phone: false, message: false };

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) {
    errors.name = 'Name is required.';
  } else if (form.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }
  if (!form.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_RE.test(form.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!form.phone.trim()) {
    errors.phone = 'Phone number is required.';
  } else if (!PHONE_RE.test(form.phone.trim())) {
    errors.phone = 'Please enter a valid phone number.';
  }
  if (!form.message.trim()) {
    errors.message = 'Message is required.';
  } else if (form.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters.';
  }
  return errors;
}

export default function Contact() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [touched, setTouched] = useState<TouchState>(UNTOUCHED);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const errors = validate(form);
  const isValid = Object.keys(errors).length === 0;

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleBlur(
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true, message: true });
    if (!isValid) return;

    setStatus('sending');
    setErrorMessage('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          message: form.message,
          company: form.company,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setStatus('sent');
        setForm(EMPTY);
        setTouched(UNTOUCHED);
      } else {
        setStatus('error');
        setErrorMessage(data?.error || 'Something went wrong. Please try again or email me directly.');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    }
  }

  return (
    <footer id="contact" className={styles.contact}>
      <div className={styles.inner}>
        {/* ── Left column ─────────────────────────────────────── */}
        <div className={styles.left}>
          <FadeUp>
            <SectionHeader
              kicker={KICKER}
              heading={HEADING}
              headingId="contact-heading"
              intro={INTRO}
            />
          </FadeUp>

          <FadeUp delay={0.15}>
            <div className={styles.socialGrid}>
              {SOCIAL_LINKS.map(({ icon: Icon, label, href, external, tooltip }) => (
                <a
                  key={label}
                  href={href}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className={styles.socialItem}
                  aria-label={label}
                >
                  <span className={styles.socialDisc}>
                    <Icon size={20} stroke={1.8} />
                  </span>
                  <span className={styles.socialLabel}>{label}</span>
                  {tooltip && (
                    <span className={styles.tooltip} aria-hidden>{tooltip}</span>
                  )}
                </a>
              ))}
            </div>
          </FadeUp>
        </div>

        {/* ── Right column: form ───────────────────────────────── */}
        <FadeUp delay={0.22} className={styles.right}>
          {status === 'sent' ? (
            <div className={styles.successState}>
              <IconMailOpened size={48} stroke={1.2} className={styles.successIcon} />
              <p className={styles.successTitle}>Message sent!</p>
              <p className={styles.successBody}>
                Thanks for reaching out — I&apos;ll get back to you soon.
              </p>
              <CTA
                variant="ghost"
                className={styles.resetBtn}
                onClick={() => setStatus('idle')}
              >
                Send another
              </CTA>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              aria-labelledby="contact-heading"
              className={styles.form}
            >
              {/* Honeypot: hidden from sighted and screen-reader users alike.
                  Bots that auto-fill every field will trip it; real visitors never will. */}
              <div style={{ position: 'absolute', left: '-9999px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }} aria-hidden="true">
                <label htmlFor="contact-company">Company</label>
                <input
                  id="contact-company"
                  name="company"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.company}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.row}>
                {/* Name */}
                <div className={styles.field}>
                  <label htmlFor="contact-name" className={styles.label}>
                    Name <span className={styles.required} aria-hidden>*</span>
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="Your name"
                    aria-invalid={touched.name && !!errors.name}
                    aria-describedby={touched.name && errors.name ? 'err-name' : undefined}
                    className={`${styles.input}${touched.name && errors.name ? ` ${styles.inputError}` : ''}`}
                    value={form.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {touched.name && errors.name && (
                    <span id="err-name" className={styles.fieldError} role="alert">{errors.name}</span>
                  )}
                </div>

                {/* Email */}
                <div className={styles.field}>
                  <label htmlFor="contact-email" className={styles.label}>
                    Email <span className={styles.required} aria-hidden>*</span>
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    aria-invalid={touched.email && !!errors.email}
                    aria-describedby={touched.email && errors.email ? 'err-email' : undefined}
                    className={`${styles.input}${touched.email && errors.email ? ` ${styles.inputError}` : ''}`}
                    value={form.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {touched.email && errors.email && (
                    <span id="err-email" className={styles.fieldError} role="alert">{errors.email}</span>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className={styles.field}>
                <label htmlFor="contact-phone" className={styles.label}>
                  Phone number <span className={styles.required} aria-hidden>*</span>
                </label>
                <input
                  id="contact-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  placeholder="+91 98765 43210"
                  aria-invalid={touched.phone && !!errors.phone}
                  aria-describedby={touched.phone && errors.phone ? 'err-phone' : undefined}
                  className={`${styles.input}${touched.phone && errors.phone ? ` ${styles.inputError}` : ''}`}
                  value={form.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {touched.phone && errors.phone && (
                  <span id="err-phone" className={styles.fieldError} role="alert">{errors.phone}</span>
                )}
              </div>

              {/* Message */}
              <div className={styles.field}>
                <label htmlFor="contact-message" className={styles.label}>
                  Message <span className={styles.required} aria-hidden>*</span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={5}
                  placeholder="Tell me what's on your mind…"
                  aria-invalid={touched.message && !!errors.message}
                  aria-describedby={touched.message && errors.message ? 'err-message' : undefined}
                  className={`${styles.textarea}${touched.message && errors.message ? ` ${styles.inputError}` : ''}`}
                  value={form.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {touched.message && errors.message && (
                  <span id="err-message" className={styles.fieldError} role="alert">{errors.message}</span>
                )}
              </div>

              {status === 'error' && (
                <p className={styles.errorMsg} role="alert">
                  {errorMessage}
                </p>
              )}

              <CTA
                type="submit"
                variant="primary"
                disabled={!isValid || status === 'sending'}
                className={styles.submitBtn}
              >
                {status === 'sending' ? 'Sending…' : 'Send message →'}
              </CTA>
            </form>
          )}
        </FadeUp>
      </div>

      {/* ── Footer bar ──────────────────────────────────────────── */}
      <div className={styles.footerBar}>
        <p className={styles.credit}>Developed by Soumya Ranjan Panda</p>
      </div>
    </footer>
  );
}
