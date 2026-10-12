import { Brand } from "@/components/site-shell";
import Link from "next/link";
import { isConfigured } from "@/lib/env";
import { LoginForm } from "./sign-in-form";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Staff sign in",
  robots: { index: false, follow: false },
};
export default function Login() {
  const configured = isConfigured();
  return (
    <main id="main" className="login-page">
      <div className="login-card">
        <Brand />
        <div className="eyebrow">STAFF WORKSPACE</div>
        <h1>Welcome back.</h1>
        <p>Sign in with your authorized lab account.</p>
        {configured ? (
          <LoginForm />
        ) : (
          <div className="notice">
            <strong>Staff access is not configured yet.</strong>
            <br />
            The administrator needs to connect Neon, set the authentication
            secret, and provision the first owner using the setup guide. Sign-in
            stays disabled until configuration is complete.
          </div>
        )}
        <Link className="back-link" href="/">
          ← Back to the public website
        </Link>
      </div>
    </main>
  );
}
