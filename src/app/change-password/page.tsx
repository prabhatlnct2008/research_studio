import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/authz";
import { changePassword } from "@/actions/account";
import { ChangePasswordForm } from "@/components/change-password-form";
import { LogoMark } from "@/components/logo";

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-2 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <LogoMark className="h-9 w-9 text-accent" />
          <h1 className="text-title font-bold text-ink">
            {user.mustChangePassword ? "Set a new password" : "Change password"}
          </h1>
          {user.mustChangePassword && (
            <p className="text-center text-meta text-muted">
              You're using a temporary password. Choose a new one to continue.
            </p>
          )}
        </div>
        <ChangePasswordForm action={changePassword} />
      </div>
    </main>
  );
}
