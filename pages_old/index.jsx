import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const getServerSideProps = async () => {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookies().getAll(),
        setAll: () => {},
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: { destination: '/login', permanent: false },
    };
  }

  return {
    props: { session },
  };
};
