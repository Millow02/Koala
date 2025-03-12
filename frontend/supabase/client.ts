// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/auth-helpers-remix";
import type { Database } from "~/types/supabase";

// These environment variables need to be available client-side
// You should be exposing them in your root loader
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabase() {
  if (!supabaseInstance) {
    // Get environment variables from window.env (set in your root route)
    const supabaseUrl = process.env?.SUPABASE_URL;
    const supabaseAnonKey = process.env?.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL and anon key must be available in window.env');
    }
    
    supabaseInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  
  return supabaseInstance;
}

// Additional type definition for window.env
