import {
  useLoaderData,
  Outlet,
  useNavigate,
  data,
  useLocation,
} from "@remix-run/react";
import Sidebar from "~/components/Sidebar";
import {
  createBrowserClient,
  createServerClient,
  User,
} from "@supabase/auth-helpers-remix";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Database } from "~/types/supabase";
import { useEffect, useState } from "react";

type LoaderData = {
  env: {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
  };
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const response = new Response();

  const supabaseClient = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { request, response }
  );

  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  };

  return {
    env,
    headers: response.headers,
  };
};

export default function Dashboard() {
  const location = useLocation();
  const { env } = useLoaderData<LoaderData>();
  const [user, setUser] = useState<User | null>(null);
  const [supabase] = useState(() =>
    createBrowserClient(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!)
  );

  const hideSidebarRoutes = ["/dashboard/new-lot"]; // Add any routes where you want to hide sidebar
  const shouldShowSidebar = !hideSidebarRoutes.includes(location.pathname);

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
  }, [supabase]);

  return (
    <div className="flex items-start">
      {shouldShowSidebar && <Sidebar />}
      <main className="w-full">
        <div className="p-6">
          <Outlet context={{ user, supabase }} />
        </div>
      </main>
    </div>
  );
}
