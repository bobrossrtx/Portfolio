import { useMemo, useState } from 'react';
import {
  FaDiscord,
  FaEnvelope,
  FaGithub,
  FaLinkedin,
  FaXTwitter,
} from 'react-icons/fa6';
import { contactConfig } from '../../data/contact';
import './Contact.scss';

type FormState = {
  name: string;
  email: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

type SubmitStatus =
  | { type: 'idle' }
  | { type: 'error'; message: string }
  | { type: 'success'; message: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Contact = () => {
  const [form, setForm] = useState<FormState>({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<SubmitStatus>({ type: 'idle' });

  const socialIcons = useMemo(
    () =>
      ({
        github: <FaGithub aria-hidden="true" />,
        linkedin: <FaLinkedin aria-hidden="true" />,
        email: <FaEnvelope aria-hidden="true" />,
        x: <FaXTwitter aria-hidden="true" />,
        discord: <FaDiscord aria-hidden="true" />,
      }) as const,
    [],
  );

  const validate = (state: FormState): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!state.name.trim()) nextErrors.name = 'Name is required.';

    if (!state.email.trim()) nextErrors.email = 'Email is required.';
    else if (!emailPattern.test(state.email.trim())) nextErrors.email = 'Enter a valid email address.';

    if (!state.message.trim()) nextErrors.message = 'Message is required.';

    return nextErrors;
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus({ type: 'error', message: 'Please fix the highlighted fields and try again.' });
      return;
    }

    setStatus({
      type: 'success',
      message: 'Thanks! This contact form is a UI placeholder for now, but I’ve got your message details.',
    });

    setForm({ name: '', email: '', message: '' });
  };

  const setField = (key: keyof FormState, value: string) => {
    setForm(current => ({ ...current, [key]: value }));
    setErrors(current => {
      if (!current[key]) return current;
      const { [key]: _removed, ...rest } = current;
      return rest;
    });
    if (status.type !== 'idle') setStatus({ type: 'idle' });
  };

  return (
    <section id="contact" className="section contact" aria-labelledby="contact-title">
      <div className="contact__head">
        <div className="section__head">
          <h2 id="contact-title">{contactConfig.heading}</h2>
          <p>{contactConfig.intro}</p>
        </div>

        <div className="contact__availability" aria-label={`Availability: ${contactConfig.availability}`}>
          <span className="contact__availability-dot" aria-hidden="true" />
          <span className="contact__availability-label">Availability</span>
          <span className="contact__availability-value">{contactConfig.availability}</span>
        </div>
      </div>

      <div className="contact__layout">
        <form className="contact-card contact-form" noValidate onSubmit={onSubmit}>
          <div className="contact-form__field">
            <label htmlFor="contact-name">Name</label>
            <input
              id="contact-name"
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={event => setField('name', event.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'contact-name-error' : undefined}
            />
            {errors.name && (
              <p id="contact-name-error" className="contact-form__error" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          <div className="contact-form__field">
            <label htmlFor="contact-email">Email</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={event => setField('email', event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'contact-email-error' : undefined}
            />
            {errors.email && (
              <p id="contact-email-error" className="contact-form__error" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <div className="contact-form__field">
            <label htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              name="message"
              rows={6}
              value={form.message}
              onChange={event => setField('message', event.target.value)}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? 'contact-message-error' : undefined}
            />
            {errors.message && (
              <p id="contact-message-error" className="contact-form__error" role="alert">
                {errors.message}
              </p>
            )}
          </div>

          <button className="btn btn--primary contact-form__submit" type="submit">
            Send message
          </button>

          {status.type !== 'idle' && (
            <p
              className={`contact-form__status contact-form__status--${status.type}`}
              role="status"
              aria-live="polite"
            >
              {status.message}
            </p>
          )}
        </form>

        <aside className="contact-card contact-links" aria-label="Social links">
          <h3 className="contact-links__title">Social</h3>
          <ul className="contact-links__list">
            {contactConfig.socials.map(social => {
              const icon = socialIcons[social.id];

              if (!social.href) {
                return (
                  <li key={social.id} className="contact-links__item contact-links__item--disabled">
                    <span className="contact-links__row" aria-disabled="true">
                      <span className="contact-links__icon">{icon}</span>
                      <span className="contact-links__label">{social.label}</span>
                      <span className="contact-links__note">{social.note ?? 'Coming soon'}</span>
                    </span>
                  </li>
                );
              }

              return (
                <li key={social.id} className="contact-links__item">
                  <a className="contact-links__row" href={social.href} target="_blank" rel="noreferrer">
                    <span className="contact-links__icon">{icon}</span>
                    <span className="contact-links__label">{social.label}</span>
                    {social.note && <span className="contact-links__note">{social.note}</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </section>
  );
};

export default Contact;
