import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, auth } from "@/auth";
import { LogoMark } from "@/components/logo";
import { LoginForm } from "@/components/login-form";

async function login(_prev: string | undefined, formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) return "Invalid email or password.";
    throw error; // re-throw NEXT_REDIRECT
  }
}

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-2 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <LogoMark className="h-9 w-9 text-accent" />
          <h1 className="text-title font-bold text-ink">Studio</h1>
          <p className="text-meta text-muted">Sign in to your workspace</p>
        </div>
        <LoginForm action={login} />
        <p className="mt-6 text-center text-meta text-faint">
          Access is provisioned by an administrator.
        </p>
      </div>
    </main>
  );
}
