import { useLoaderData, Outlet, useNavigate } from "@remix-run/react";
import Sidebar from "~/components/Sidebar";
import {
  createBrowserClient,
  createServerClient,
  User,
} from "@supabase/auth-helpers-remix";
import type { LoaderFunctionArgs } from "@remix-run/node";
import type { Profile } from "~/types/profile";
import { useEffect, useState } from "react";

type LoaderData = {
  profile: Profile;
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

  const { data } = await supabaseClient.from("Profile").select();

  return {
    profile: data,
    headers: response.headers,
    env,
  };
};

export default function Dashboard() {
  const { profile } = useLoaderData<LoaderData>();
  const { env } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const [supabase] = useState(() =>
    createBrowserClient(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!)
  );

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

  const sections = [
    {
      header: "Parking Lots",
      links: [{ label: "All Parking Lots", path: "/dashboard/lot-a" }],
    },
    {
      header: "Organizations",
      links: [
        { label: "Concordia", path: "/dashboard/org-1" },
        { label: "Mcgill", path: "/dashboard/org-2" },
      ],
    },
    {
      header: "Account",
      links: [
        { label: "Preferences", path: "/dashboard/preferences" },
        { label: "Vehicles", path: "/dashboard/vehicles" },
      ],
    },
  ];

  return (
    <div className="flex h-screen">
      <Sidebar sections={sections} />
      {/* Main Content */}
      <main className="w-full">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
