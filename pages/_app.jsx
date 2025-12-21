import '../styles/globals.css';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { supabase } from '../lib/supabaseClient';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Pages that do not require authentication
  const publicPages = ['/login', '/set-password'];
  const isPublicPage = publicPages.includes(router.pathname);

  useEffect(() => {
    // Check current session
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setUser(session.user);
      } else if (!isPublicPage) {
        router.replace('/login'); // redirect unauthenticated users
        return;
      }

      setAuthChecked(true);
    }

    checkSession();

    // Listen to auth state changes (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !isPublicPage) {
        router.replace('/login');
      } else {
        setUser(session?.user || null);
        setAuthChecked(true);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [router, isPublicPage]);

  if (!authChecked) {
    // Optional: loading state while checking session
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (isPublicPage) {
    return <Component {...pageProps} />;
  }

  return (
    <AppLayout user={user}>
      <Component {...pageProps} user={user} />
    </AppLayout>
  );
}

export default MyApp;
