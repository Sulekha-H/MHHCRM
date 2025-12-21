import { supabase } from "@/lib/supabaseClient";

export async function getServerSideProps({ req }) {
  const { data: { session } } = await supabase.auth.getSession(); // server-side version
  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      }
    }
  }

  return { props: {} }; // User is authenticated
}

export default function HomePage() {
  return <div>Protected Home Page Content</div>;
}
