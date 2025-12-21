import '../styles/globals.css';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import AppLayout from '../components/AppLayout';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const publicPages = ['/login', '/set-password'];

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      } else if (!publicPages.includes(router.pathname)) {
        router.replace('/login');
      }
      setLoading(false);
    };

    checkSession();

    // Listen to auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (!session && !publicPages.includes(router.pathname)) {
        router.replace('/login');
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  // ✅ Do not render anything until loading is complete
  if (loading) return null;

  // Render public pages normally
  if (publicPages.includes(router.pathname)) {
    return <Component {...pageProps} />;
  }

  // Render protected pages inside AppLayout
  return (
    <AppLayout user={user}>
      <Component {...pageProps} />
    </AppLayout>
  );
}

export default MyApp;
