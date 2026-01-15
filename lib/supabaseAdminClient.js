import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL, //server only
  process.env.SUPABASE_SERVICE_ROLE_KEY //full access never exposed to browser
);
