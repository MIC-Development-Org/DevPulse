import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignupForm } from "./signup-form";

/**
 * Server gate (Phase 2): authenticated users are redirected away from the
 * signup page; everyone else sees the existing client form unchanged.
 */
export default async function SignupPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return <SignupForm />;
}
