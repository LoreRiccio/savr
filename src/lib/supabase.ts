import "react-native-url-polyfill/auto";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error("EXPO_PUBLIC_SUPABASE_URL non è configurato.");
}

if (!supabasePublishableKey) {
  throw new Error("EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY non è configurato.");
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
