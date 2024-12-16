import { useLoaderData } from "@remix-run/react";
import { createServerClient } from "@supabase/auth-helpers-remix";

import type { LoaderFunctionArgs } from '@remix-run/node'

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const response = new Response()

    const supabaseClient = createServerClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        { request, response}
        
    );

    const {data} = await supabaseClient.from
    ('Profile').select()

    return {
        data,
        headers: response.headers,
       
    };

};




export default function Dashboard() {
    const data = useLoaderData();
    return <pre>{JSON.stringify(data, null, 2)}</pre>
}