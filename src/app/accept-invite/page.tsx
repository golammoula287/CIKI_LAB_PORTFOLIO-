import { Brand } from "@/components/site-shell";
import { AcceptInvite } from "@/features/staff/forms";
export const metadata = {
  title: "Set up staff access",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default function Accept() {
  return (
    <main id="main" className="login-page">
      <div className="login-card">
        <Brand />
        <h1>Set up your access.</h1>
        <AcceptInvite />
      </div>
    </main>
  );
}
