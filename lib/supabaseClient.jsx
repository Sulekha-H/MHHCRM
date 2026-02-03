import { createClient } from "@supabase/supabase-js";
import { useAuth } from '@clerk/nextjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Keep this static one for parts of the app that don't need Auth
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// THIS is the hook you use in your pages for RLS tables
export const useSupabase = () => {
  const { getToken } = useAuth(); // You were missing this line!

  const getSupabaseClient = async () => {
    const token = await getToken({ template: 'supabase' });
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  };

