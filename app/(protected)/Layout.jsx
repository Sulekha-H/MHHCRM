import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ClientAppLayout from "@/components/ClientAppLayout";

export default function ProtectedLayout({ children }) {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <ClientAppLayout>{children}</ClientAppLayout>;
}
