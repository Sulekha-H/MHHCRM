import { Webhook } from "svix";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req) {
  const body = await req.text();
  const signature = headers().get("Clerk-Signature");

  // Use svix to verify webhook
  const wh = new Webhook(process.env.CLERK_API_KEY); // server-side key
  const event = wh.verify(body, signature);

  // Example: insert user into Supabase profiles
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .insert([{ clerk_user_id: event.data.id, email: event.data.email_address }]);

  return new Response(JSON.stringify({ data, error }));
}
