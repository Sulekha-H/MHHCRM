// app/api/createProfile/route.js
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req) {
  const body = await req.json();
  const { userId, fullName } = body;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .insert([{ ID: userId, "Full Name": fullName, "Created At": new Date() }]);

  if (error) return new Response(JSON.stringify({ error }), { status: 500 });
  return new Response(JSON.stringify({ data }), { status: 200 });
}
