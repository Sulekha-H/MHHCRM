// app/protected/layout.jsx
import { ClerkProvider, auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import ClientAppLayout from "@/components/ClientAppLayout";

export default async function ProtectedLayout({ children }) {
  const { userId } = auth(); // Clerk server-side auth

  if (!userId) redirect("/sign-in"); // redirect if not logged in

  return (
    <ClerkProvider>
      <ClientAppLayout>{children}</ClientAppLayout>
    </ClerkProvider>
  );
}
