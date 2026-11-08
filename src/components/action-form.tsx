"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionResult } from "@/lib/result";

export function Submit({
  children,
  className = "button",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? "İşleniyor…" : children}
    </button>
  );
}
export function ActionForm({
  action,
  children,
  className = "form-stack",
  submitLabel,
}: {
  action: (data: FormData) => Promise<ActionResult>;
  children?: React.ReactNode;
  className?: string;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(
    async (_: ActionResult, data: FormData) => action(data),
    null,
  );
  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error && (
        <p className="notice error" role="alert">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="notice success" role="status">
          {state.success}
        </p>
      )}
      {submitLabel && <Submit>{submitLabel}</Submit>}
    </form>
  );
}
