import '../styles/globals.css';
import { useRouter } from 'next/router';
import AppLayout from '../components/AppLayout';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  
  // Pages that should NOT have the AppLayout authentication check
  const publicPages = ['/SupabaseLogin', '/SetPassword', '/supabaselogin', '/setpassword'];
  const isPublicPage = publicPages.includes(router.pathname.toLowerCase()) || 
                        publicPages.includes(router.pathname);
  
  if (isPublicPage) {
    return <Component {...pageProps} />;
  }
  
  return (
    <AppLayout>
      <Component {...pageProps} />
    </AppLayout>
  );
}

export default MyApp;