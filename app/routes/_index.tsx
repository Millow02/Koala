import type { MetaFunction } from "@remix-run/node";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useOutletContext, useRevalidator } from "@remix-run/react";
import { createBrowserClient, createServerClient, SupabaseClient } from "@supabase/auth-helpers-remix";
import { useEffect, useState } from "react";

import { Database } from "../types/supabase";



export const meta: MetaFunction = () => {
  return [
    { title: "Koala" },
    { name: "Koala", content: "Welcome to Koala !" },
  ];
};


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

export default function Index() {


  const data = useLoaderData();

  const { supabase } = useOutletContext<{ supabase: SupabaseClient<Database> }>()


    const signUp = () => {
       supabase.auth.signUp({
        email: "smcdo0211@gmail.com",
        password: "password1234",
      });
  
    };
  
  
      const signIn = () => {
        supabase.auth.signInWithPassword({
          email: "smcdo0211@gmail.com",
          password: "password1234",
        });
      };
  
      const signOut = () => {
        supabase.auth.signOut();
      };

      const revalidator = useRevalidator();

      useEffect(() => {
        const {data: {subscription }} = supabase.auth.onAuthStateChange(() => {
          revalidator.revalidate();
        })

        return () => {
          subscription.unsubscribe()
        };
      }, [supabase, revalidator]);



  return (
    <div className="flex h-screen items-center justify-center ">
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <button className='bg-white m-4 text-black p-3' onClick={signUp}>Sign up</button>
      <button className='bg-white m-4 text-black p-3' onClick={signIn}>Sign in</button>
      <button className='bg-white m-4 text-black p-3' onClick={signOut}>Sign out</button>
      <h1 className="leading text-2xl font-bold text-white">Koala Dashboard</h1> 
    </div>

  );
}


  


