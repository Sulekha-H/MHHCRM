import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default async function Dashboard() {
  const { userId, emailAddresses } = auth();

  if (!userId) redirect("/sign-in"); // protect route

  // Check if profile exists, create if missing
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", userId)
    .single();

  if (!data) {
    await supabase.from("profiles").insert({
      clerk_user_id: userId,
      email: emailAddresses[0].emailAddress,
    });
  }

  return <div>Welcome to your dashboard, {emailAddresses[0].emailAddress}</div>;
}
