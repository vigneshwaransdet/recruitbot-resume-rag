import { Mail, Phone, MapPin } from 'lucide-react';

interface ContactSectionProps {
  email?: string;
  phoneNumber?: string;
  location?: string;
}

/**
 * ContactSection — email / phone / location rows. Only renders rows that
 * have data, and the whole section is hidden when nothing is available.
 */
export function ContactSection({ email, phoneNumber, location }: ContactSectionProps) {
  if (!email && !phoneNumber && !location) return null;

  return (
    <section>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-widest text-text-muted">
        Contact
      </h3>
      <div className="flex flex-col gap-1.5 text-sm text-text-primary">
        {email && (
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center gap-2 hover:text-primary"
          >
            <Mail size={14} className="text-text-muted" />
            {email}
          </a>
        )}
        {phoneNumber && (
          <span className="inline-flex items-center gap-2">
            <Phone size={14} className="text-text-muted" />
            {phoneNumber}
          </span>
        )}
        {location && (
          <span className="inline-flex items-center gap-2">
            <MapPin size={14} className="text-text-muted" />
            {location}
          </span>
        )}
      </div>
    </section>
  );
}
