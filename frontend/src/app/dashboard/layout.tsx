import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Server-side route protection for the dashboard (Phase 2).
 *
 * `auth()` reads the HttpOnly session cookie inside the server process and
 * resolves the DB-backed session. Unauthenticated visitors are redirected to
 * /login before any dashboard code runs; locale of client state is irrelevant.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <>{children}</>;
}
