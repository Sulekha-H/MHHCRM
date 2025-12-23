// /lib/requireAuth.js
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";

export async function requireAuth(context) {
  const supabase = createServerSupabaseClient(context);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return {
    props: {
      session, // <-- pass session to the page
    },
  };
}
