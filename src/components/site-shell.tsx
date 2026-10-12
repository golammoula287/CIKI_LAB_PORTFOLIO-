import Link from "next/link";
import { ArrowUpRight, FlaskConical } from "lucide-react";
import { navigation } from "@/lib/catalog";
import { defaultSettings, type SettingsData } from "@/features/settings/schema";
import { MediaImage } from "./media-image";
export function Brand({
  settings = defaultSettings,
}: {
  settings?: SettingsData;
}) {
  return (
    <Link href="/" className="brand" aria-label={`${settings.labName} home`}>
      <span className="brand-icon">
        {settings.logoId ? (
          <MediaImage id={settings.logoId} alt="" className="brand-logo" />
        ) : (
          <FlaskConical size={22} />
        )}
      </span>
      <span>
        {settings.labName}
        <small>{settings.tagline}</small>
      </span>
    </Link>
  );
}
export function Header({
  settings = defaultSettings,
}: {
  settings?: SettingsData;
}) {
  const labels = [
    settings.researchLabel,
    settings.achievementsLabel,
    settings.membersLabel,
    settings.recruitmentLabel,
    settings.aboutLabel,
  ];
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand settings={settings} />
        <nav aria-label="Main navigation">
          {navigation.map(([, href], index) => (
            <Link key={href} href={href}>
              {labels[index]}
            </Link>
          ))}
        </nav>
        <Link className="contact-link" href="/contact">
          Get in touch <ArrowUpRight size={16} />
        </Link>
        <details className="mobile-menu">
          <summary>Menu</summary>
          <nav aria-label="Mobile navigation">
            {navigation.map(([, href], index) => (
              <Link key={href} href={href}>
                {labels[index]}
              </Link>
            ))}
            <Link href="/contact">Contact</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
export function Footer({
  settings = defaultSettings,
}: {
  settings?: SettingsData;
}) {
  return (
    <footer>
      <div className="container footer-grid">
        <div>
          <Brand settings={settings} />
          <p>{settings.description}</p>
        </div>
        <div>
          <h3>Explore</h3>
          <Link href="/research">Research departments</Link>
          <Link href="/achievements">Achievements</Link>
          <Link href="/gallery">Photo gallery</Link>
        </div>
        <div>
          <h3>Our community</h3>
          <Link href="/members">Members</Link>
          <Link href="/advisory-panel">Advisory panel</Link>
          <Link href="/recruitment">Join the lab</Link>
        </div>
        <div>
          <h3>Information</h3>
          <Link href="/policies">Research ethics & policy</Link>
          <Link href="/contact">Contact us</Link>
          <Link href="/admin">
            Staff dashboard <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} {settings.labName}
        </span>
        <span>{settings.tagline}</span>
      </div>
    </footer>
  );
}
