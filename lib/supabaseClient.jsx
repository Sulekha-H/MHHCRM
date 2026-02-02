// lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";
import { useAuth } from '@clerk/nextjs';


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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

  return { getSupabaseClient };
};
