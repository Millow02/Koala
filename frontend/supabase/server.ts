import { createBrowserClient } from "@supabase/auth-helpers-remix";
import { createServerClient } from "@supabase/auth-helpers-remix";

import type { Database } from "~/types/supabase";
import { type Session } from "@supabase/auth-helpers-remix";
import { type LoaderFunctionArgs } from "@remix-run/server-runtime";

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export async function getSupabaseServerClient(request: Request) {
    const env = { 
        SUPABASE_URL: process.env.SUPABASE_URL!,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
    };

    const response = new Response();

    const supabaseClient = createServerClient<Database>(
        env.SUPABASE_URL,
        env.SUPABASE_ANON_KEY,
        { request, response }
    );

    return { supabaseClient, response };
}

export async function getUserFromSession(request: Request): Promise<{ user: any, session: Session | null }> {
    const { supabaseClient } = await getSupabaseServerClient(request);
    const { data: { session } } = await supabaseClient.auth.getSession();

    return {
        user: session?.user || null,
        session
    };
}