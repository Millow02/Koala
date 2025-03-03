import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { createBrowserClient, createServerClient } from "@supabase/auth-helpers-remix";
import { useEffect, useState } from "react";
import "./tailwind.css";

import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";


export const loader = async ({ request }: LoaderFunctionArgs) => {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  }

  return { env };
};



export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}


export default function App() {
  const { env } = useLoaderData<typeof loader>();
  const [ supabase ] = useState(() =>
   createBrowserClient(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!)
   );
  return <Outlet context={{ supabase }}/>;
}
