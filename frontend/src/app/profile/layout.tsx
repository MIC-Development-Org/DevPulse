import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Server-side route protection for the profile pages (Phase 2). */
export default async function ProfileLayout({
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
