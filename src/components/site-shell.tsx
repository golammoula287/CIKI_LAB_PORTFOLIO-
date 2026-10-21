import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { PublicNavigation } from "./public-navigation";
import { defaultSettings, type SettingsData } from "@/features/settings/schema";
import { MediaImage } from "./media-image";
export function Brand({
  settings = defaultSettings,
  inverse = false,
  stacked = false,
}: {
  settings?: SettingsData;
  inverse?: boolean;
  stacked?: boolean;
}) {
  return (
    <Link href="/" className="brand" aria-label={`${settings.labName} home`}>
      {stacked ? (
        <Image
          src="/brand/ciki-full-logo.png"
          alt=""
          width={1800}
          height={1050}
          sizes="(max-width: 580px) 116px, 136px"
          className="nav-full-logo"
          priority
        />
      ) : settings.logoId ? (
        <span className="brand-icon">
          <MediaImage id={settings.logoId} alt="" className="brand-logo" />
        </span>
      ) : (
        <Image
          src={
            inverse ? "/brand/ciki-navbar-white.png" : "/brand/ciki-navbar.png"
          }
          alt=""
          width={160}
          height={60}
          className="brand-wordmark"
        />
      )}
      <span className="brand-description">
        {(settings.logoId ||
          !["CIKI", "CIKI Lab"].includes(settings.labName)) && (
          <span className="brand-name">{settings.labName}</span>
        )}
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
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand settings={settings} stacked />
        <PublicNavigation
          labels={{
            research: settings.researchLabel,
            achievements: settings.achievementsLabel,
            members: settings.membersLabel,
            recruitment: settings.recruitmentLabel,
            about: settings.aboutLabel,
          }}
        />
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
          <Brand settings={settings} inverse />
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
