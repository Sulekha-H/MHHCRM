import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export async function requireAuth(ctx) {
  const supabase = createServerSupabaseClient(ctx);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 🚫 Not logged in → redirect
  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  // ✅ Logged in → allow page to render
  return {
    props: {},
  };
}
