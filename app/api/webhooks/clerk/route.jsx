import { Webhook } from "svix";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req) {
  const payload = await req.text();
  const headersList = headers();

  const svix_id = headersList.get("svix-id");
  const svix_timestamp = headersList.get("svix-timestamp");
  const svix_signature = headersList.get("svix-signature");

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

  let event;
  try {
    event = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "user.created") {
    const user = event.data;

    await supabaseAdmin.from("profiles").insert({
      ID: user.id,
      "Full Name": user.first_name ?? "",
      Role: "Staff",
      "Created At": new Date(),
    });
  }

  return new Response("OK");
}
