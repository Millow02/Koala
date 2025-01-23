import type { MetaFunction } from "@remix-run/node";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useNavigate, useOutletContext, useRevalidator } from "@remix-run/react";
import { createBrowserClient, createServerClient, SupabaseClient } from "@supabase/auth-helpers-remix";
import { useEffect, useState } from "react";
import { createClient, User } from "@supabase/supabase-js";
import  Navbar  from "../components/Navbar"


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

  const { supabase } = useOutletContext<{ supabase: SupabaseClient<Database> }>()
  const data = useLoaderData();
  const revalidator = useRevalidator();
  const navigate = useNavigate();

    const [user, setUser] = useState<User | null>(null);
  
    useEffect(() => {
      const fetchUser = async () => {
        const { data, error } = await supabase.auth.getUser();
  
        if (error) {
          console.error("Error fetching user:", error.message);
        } else {
          setUser(data?.user || null);
        }
      };
  
      fetchUser();
    }, []);

    useEffect(() => {
      if (user) {
        navigate("/dashboard"); // navigate to dashboard if a user is signed in
      }
    }, [user, navigate]);

  return (
    <div>
      {!user ? (
        <div>
          <Navbar />
          <div className="flex h-screen items-center justify-center ">
            <h1 className="leading text-2xl font-bold text-white">Koala landing page</h1> 
          </div>
        </div>
      ) : (
          <div>
            Loading...
          </div>
      )}
    </div>
  );
}


// old code 

    // useEffect(() => {
    //   const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
    //     if (session?.user) {
    //       setUser(session.user); 
    //     } else {
    //       setUser(null); 
    //     }
    //     revalidator.revalidate(); 
    //   });
  
    //   return () => {
    //     subscription.subscription.unsubscribe(); 
    //   };
    // }, [supabase, revalidator]);

