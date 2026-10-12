"use client";
import { useActionState, useEffect, useState, useRef } from "react";
import {
  issueStaffLink,
  acceptStaffLink,
  updateStaffAction,
  revokeGrantAction,
} from "@/server/actions/staff";
import { createAuthClient } from "better-auth/react";
import { TextField } from "@/features/content/editor";
function Feedback({ state }: { state: { error: string; success?: string } }) {
  return (
    <>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="notice" role="status">
          {state.success}
        </p>
      )}
    </>
  );
}
export function InviteForm() {
  const [state, action, pending] = useActionState(issueStaffLink, {
    error: "",
  });
  return (
    <form action={action} className="panel form-stack">
      <h2>Invite staff or issue a recovery link</h2>
      <div className="form-grid">
        <TextField name="name" label="Recipient name" required />
        <TextField name="email" label="Recipient email" type="email" required />
        <label className="field">
          Purpose
          <select aria-label="Purpose" name="purpose">
            <option value="INVITE">New staff invitation</option>
            <option value="RESET">Existing staff password recovery</option>
          </select>
        </label>
        <label className="field">
          Role for new staff
          <select aria-label="Role for new staff" name="role">
            <option>EDITOR</option>
            <option>ADMIN</option>
            <option>OWNER</option>
          </select>
        </label>
      </div>
      <Feedback state={state} />
      {state.link && (
        <label className="field">
          Private single-use link
          <input
            readOnly
            value={state.link}
            onFocus={(e) => e.target.select()}
          />
        </label>
      )}
      <button className="button primary" disabled={pending}>
        Create private link
      </button>
    </form>
  );
}
export function StaffEditor({
  user,
}: {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    active: boolean;
  };
}) {
  const [state, action, pending] = useActionState(updateStaffAction, {
    error: "",
  });
  return (
    <form action={action} className="panel form-stack">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <input name="id" type="hidden" value={user.id} />
      <label className="field">
        Role
        <select aria-label="Role" name="role" defaultValue={user.role}>
          <option>EDITOR</option>
          <option>ADMIN</option>
          <option>OWNER</option>
        </select>
      </label>
      <label className="checkbox-field">
        <input type="checkbox" name="active" defaultChecked={user.active} />
        Active staff access
      </label>
      <Feedback state={state} />
      <button className="button secondary" disabled={pending}>
        Update access
      </button>
    </form>
  );
}
export function RevokeGrant({ id }: { id: string }) {
  const [state, action, pending] = useActionState(revokeGrantAction, {
    error: "",
  });
  return (
    <form action={action}>
      <input name="id" type="hidden" value={id} />
      <button className="button danger" disabled={pending}>
        Revoke link
      </button>
      <Feedback state={state} />
    </form>
  );
}
export function AcceptInvite() {
  const tokenInput = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState(acceptStaffLink, {
    error: "",
  });
  useEffect(() => {
    const fragment = window.location.hash.slice(1);
    if (fragment && tokenInput.current) {
      tokenInput.current.defaultValue = fragment;
      tokenInput.current.value = fragment;
    }
    window.history.replaceState(null, "", window.location.pathname);
  }, []);
  return (
    <form action={action} className="form-stack">
      <input name="token" type="hidden" ref={tokenInput} />
      <p>
        Your private link sets up your password. Existing sessions are revoked
        when recovering an account.
      </p>
      <TextField
        name="password"
        label="New password (12–128 characters)"
        type="password"
        required
      />
      <TextField
        name="confirmPassword"
        label="Confirm password"
        type="password"
        required
      />
      <Feedback state={state} />
      <p className="muted">
        Use the complete private link provided by the lab owner.
      </p>
      <button className="button primary" disabled={pending}>
        {pending ? "Saving…" : "Set password"}
      </button>
    </form>
  );
}
export function ChangePassword() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <form
      className="panel form-stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setMessage("");
        const form = e.currentTarget;
        const data = new FormData(form);
        if (data.get("newPassword") !== data.get("confirmPassword")) {
          setMessage("Passwords do not match.");
          setPending(false);
          return;
        }
        try {
          const result = await createAuthClient().changePassword({
            currentPassword: String(data.get("currentPassword")),
            newPassword: String(data.get("newPassword")),
            revokeOtherSessions: true,
          });
          setMessage(
            result.error
              ? "Password change failed. Check your current password and use at least 12 characters."
              : "Password changed. Other sessions were revoked.",
          );
          if (!result.error) form.reset();
        } catch {
          setMessage("Password change is unavailable. Try again.");
        } finally {
          setPending(false);
        }
      }}
    >
      <TextField
        name="currentPassword"
        label="Current password"
        type="password"
        required
      />
      <TextField
        name="newPassword"
        label="New password (12–128 characters)"
        type="password"
        required
      />
      <TextField
        name="confirmPassword"
        label="Confirm new password"
        type="password"
        required
      />
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      <button className="button primary" disabled={pending}>
        Change password
      </button>
    </form>
  );
}
