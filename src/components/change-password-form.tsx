"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function ChangePasswordForm({
  action,
}: {
  action: (prev: string | undefined, formData: FormData) => Promise<string | undefined>;
}) {
  const [result, formAction, pending] = useActionState(action, undefined);
  const router = useRouter();

  useEffect(() => {
    if (result === "ok") router.push("/");
  }, [result, router]);

  return (
    <form action={formAction} className="card flex flex-col gap-4 p-6">
      <div>
        <label className="label" htmlFor="current">Current password</label>
        <input id="current" name="current" type="password" required autoComplete="current-password" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="next">New password</label>
        <input id="next" name="next" type="password" required autoComplete="new-password" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="confirm">Confirm new password</label>
        <input id="confirm" name="confirm" type="password" required autoComplete="new-password" className="input" />
      </div>
      {result && result !== "ok" && (
        <p className="rounded-[10px] bg-red-bg px-3 py-2 text-meta text-red" role="alert">{result}</p>
      )}
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
