import '../styles/globals.css';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AppLayout from '../components/AppLayout';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Pages that should NOT require login
  const publicPages = ['/set-password', '/login'];
  const isPublicPage = publicPages.includes(router.pathname);

  useEffect(() => {
    const session = supabase.auth.session();

    if (session) {
      setUser(session.user);
    } else if (!isPublicPage) {
      router.replace('/login');
      return; // stop further execution
    }

    setAuthChecked(true);

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !isPublicPage) {
        router.replace('/login');
      } else {
        setUser(session?.user || null);
        setAuthChecked(true);
      }
    });

    return () => listener.unsubscribe();
  }, [router, isPublicPage]);

  // Wait until auth is checked before rendering
  if (!authChecked) return null;

  // Render public pages directly
  if (isPublicPage) return <Component {...pageProps} />;

  // Render protected pages with AppLayout
  return (
    <AppLayout user={user}>
      <Component {...pageProps} user={user} />
    </AppLayout>
  );
}

export default MyApp;
