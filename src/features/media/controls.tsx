"use client";
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteMedia } from "@/server/actions/media";
export function UploadImage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="panel form-stack"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setPending(true);
        setError("");
        try {
          const response = await fetch("/api/uploads", {
            method: "POST",
            body: new FormData(form),
          });
          const data = await response.json();
          if (!response.ok) setError(data.error || "Upload failed.");
          else {
            form.reset();
            router.refresh();
          }
        } catch {
          setError("Upload failed. Please try again.");
        } finally {
          setPending(false);
        }
      }}
    >
      <label className="field">
        Upload an image
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp"
          required
        />
      </label>
      <p className="muted">
        JPEG, PNG or WebP, maximum 8 MB. Images remain private until used by
        published content.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="button primary" disabled={pending}>
        {pending ? "Uploading…" : "Upload image"}
      </button>
    </form>
  );
}
export function DeleteImage({
  id,
  referenced,
}: {
  id: string;
  referenced: boolean;
}) {
  const [state, action, pending] = useActionState(deleteMedia, { error: "" });
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button className="button danger" disabled={pending || referenced}>
        Delete unused image
      </button>
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      {state.success && <p role="status">{state.success}</p>}
    </form>
  );
}
