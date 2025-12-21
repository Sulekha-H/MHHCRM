import '../styles/globals.css';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { supabase } from '../lib/supabaseClient';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Pages that do NOT require login
  const publicPages = ['/login', '/set-password'];

  useEffect(() => {
    if (!router.isReady) return;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setUser(session.user);
      } else if (!publicPages.includes(router.pathname)) {
        router.replace('/login');
        return;
      }

      setAuthChecked(true);
    };

    checkSession();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);

      if (!session && !publicPages.includes(router.pathname)) {
        router.replace('/login');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [router.isReady, router.pathname]);

  // While checking auth, show loading
  if (!authChecked) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  // Public page – no layout
  if (publicPages.includes(router.pathname)) {
    return <Component {...pageProps} user={user} />;
  }

  // Authenticated page – wrap in layout
  return (
    <AppLayout user={user}>
      <Component {...pageProps} user={user} />
    </AppLayout>
  );
}

export default MyApp;
