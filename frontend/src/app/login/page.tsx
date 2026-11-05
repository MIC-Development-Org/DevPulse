import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

/**
 * Server gate (Phase 2): authenticated users are redirected away from the
 * login page; everyone else sees the existing client form unchanged.
 */
export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
