import type { MetaFunction } from "@remix-run/node";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import {
  Link,
  Outlet,
  useLoaderData,
  useNavigate,
  useOutletContext,
  useRevalidator,
} from "@remix-run/react";
import {
  createBrowserClient,
  createServerClient,
  SupabaseClient,
} from "@supabase/auth-helpers-remix";
import { useEffect, useState } from "react";
import { createClient, User } from "@supabase/supabase-js";
import Navbar from "../components/Navbar";

import { Database } from "../types/supabase";
import { ArrowBigRight, ArrowRight } from "lucide-react";

export const meta: MetaFunction = () => {
  return [{ title: "Koala" }, { name: "Koala", content: "Welcome to Koala !" }];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const response = new Response();

  const supabaseClient = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { request, response }
  );

  const { data } = await supabaseClient.from("Profile").select();

  return {
    data,
    headers: response.headers,
  };
};

export default function Index() {
  const { supabase } = useOutletContext<{
    supabase: SupabaseClient<Database>;
  }>();
  const data = useLoaderData();

  const [user, setUser] = useState<User | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.error("Error fetching user:", error.message);
      } else {
        setUser(data?.user || null);
        if (user) {
          setIsSignedIn(true);
        } else {
          setIsSignedIn(false);
        }
      }
    };

    fetchUser();
  }, [user]);

  return (
    <div className="h-screen flex items-center pb-40 justify-center bg-gradient-to-br from-[#0f0f1e] via-[#1a1a2e] to-[#232342] relative overflow-hidden icy-pink-overlay">
      <div className="flex gap-x-96 items-center">
        <div className="flex flex-col items-start">
          <h1 className="leading text-9xl font-bold text-white">Koala</h1>
          <h3 className="text-6xl text-white text-nowrap">
            Stay cozy, park easy
          </h3>
        </div>
        <div className="border-2 rounded-xl p-4 hover:bg-neutral-400/10 transition-colors">
          {isSignedIn ? (
            <Link
              to="/dashboard/lots"
              className="text-white text-4xl flex gap-x-4"
            >
              Get started <ArrowRight className="h-10 w-10"></ArrowRight>
            </Link>
          ) : (
            <Link to="sign-in" className="text-white text-4xl flex gap-x-4">
              Get started <ArrowRight className="h-10 w-10"></ArrowRight>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
