import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://jawmnnwdxfoiirzsyobv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_jnY2SOyOCCyWVHIGNPrG7Q_Wsq60E1Q";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
