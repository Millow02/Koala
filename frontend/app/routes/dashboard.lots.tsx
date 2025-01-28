import {
  Outlet,
  useLoaderData,
  useNavigate,
  useOutletContext,
} from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { SupabaseClient, User } from "@supabase/auth-helpers-remix";
import { useEffect, useState } from "react";
import { Database } from "~/types/supabase";

type ContextType = {
  user: User;
  supabase: SupabaseClient;
};

type Lots = Database["public"]["Tables"]["Lots"]["Row"];

export default function Lots() {
  const { user, supabase } = useOutletContext<ContextType>();

  const [lots, setLots] = useState<Lots[]>([]);

  useEffect(() => {
    const loadLots = async () => {
      if (!user) {
        return;
      }

      try {
        // for next time, display each of the headers + the lots for the organization for each organization that the user belongs to
        const { data, error } = await supabase
          .from("organization_members")
          .select("*")
          .eq("organization", user.id);

        if (error) {
          console.error("Error fetching lots:", error);
        } else {
          setLots(data || []);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    };

    loadLots();
  }, [supabase, user]);

  return (
    <div className="relative">
      <div className="w-full px-12 py-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold ">Parking Lots</h1>
          <div className="flex space-x-8">
            <button className="text-base bg-pink-500 rounded-lg p-2">
              Create new organization
            </button>
            <button className="text-base bg-pink-500 rounded-lg p-2">
              Create new parking lot
            </button>
          </div>
        </div>
        <div className="bg-transparent">
          have a box for each parking lot okay thank u great
        </div>
      </div>
    </div>
  );
}
