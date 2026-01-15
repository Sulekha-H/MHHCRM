import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req) {
  const { email } = await req.json();

  if (!email) return new Response("Email required", { status: 400 });

  const user = await clerkClient.users.createUser({
    emailAddress: [email],
    password: undefined, // user will set password
  });

  return new Response(JSON.stringify(user), { status: 200 });
}
