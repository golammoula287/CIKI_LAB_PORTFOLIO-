"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAuthClient } from "better-auth/react";
const auth = createAuthClient();
export function LoginForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  return (
    <form
      className="form-stack"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        const data = new FormData(event.currentTarget);
        try {
          const result = await auth.signIn.email({
            email: String(data.get("email")),
            password: String(data.get("password")),
          });
          if (result.error)
            setError(
              "Unable to sign in. Check your credentials and account access.",
            );
          else {
            router.push("/admin");
            router.refresh();
          }
        } catch {
          setError("Sign-in is temporarily unavailable. Please try again.");
        } finally {
          setPending(false);
        }
      }}
    >
      <label className="field">
        Email
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label className="field">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="button primary" disabled={pending}>
        {pending ? "Signing in…" : "Sign in →"}
      </button>
    </form>
  );
}
