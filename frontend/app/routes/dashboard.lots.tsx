import {
  Link,
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

type ParkingLot = Database["public"]["Tables"]["ParkingLot"]["Row"];
type Organization = Database["public"]["Tables"]["Organization"]["Row"];

export default function Lots() {
  const { user, supabase } = useOutletContext<ContextType>();

  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [organizationId, setOrganizationId] = useState<number | null>(null);

  useEffect(() => {
    const loadLots = async () => {
      if (!user) {
        return;
      }

      try {
        const { data: profileData, error: profileError } = await supabase
          .from("Profile")
          .select("organizationId")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          return;
        }

        const organizationId = profileData?.organizationId;
        setOrganizationId(organizationId);

        const { data, error } = await supabase
          .from("ParkingLot")
          .select("*")
          .eq("organizationId", organizationId);

        if (error) {
          console.error("Error fetching lots:", error);
        } else {
          setParkingLots(data || []);
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
          <h1 className="text-3xl font-bold ">Parking Lots</h1>
          <div className="flex space-x-8">
            {organizationId ? (
              <div>
                <Link
                  to={`/dashboard/new-lot/${organizationId}`}
                  key={organizationId}
                  className="text-base bg-pink-500 rounded-lg p-2 hover:scale-105 transition-transform duration-300 active:bg-pink-600"
                >
                  New Parking Lot
                </Link>
                <Link
                  to={`/dashboard/organization/${organizationId}`}
                  key={organizationId}
                  className="text-base"
                >
                  View Organization
                </Link>
              </div>
            ) : (
              <Link
                to={`/dashboard/new-organization/`}
                key={organizationId}
                className="text-base"
              >
                Create Organization
              </Link>
            )}
          </div>
        </div>

        {/* for next time: should display all the parking lots of your organization */}
        {organizationId ? (
          <div className="flex flex-wrap gap-x-2 justify-center">
            {parkingLots.map((parkingLot) => (
              <Link
                key={parkingLot.id}
                to={`/dashboard/lots/${parkingLot.id}`}
                className="w-2/5 min-w-64 mt-8 mr-6 rounded-lg border border-neutral-700 hover:border hover:border-white hover:scale-105 transition duration-200 cursor-pointer"
              >
                <div className="bg-neutral-700 h-64 shadow-md rounded-lg pl-4 pt-4 pr-12 pb-4  hover:border-white">
                  <div className="flex flex-col flex-wrap h-full w-1/2">
                    <div className="">
                      <h2 className="text-3xl font-bold mb-auto">
                        {parkingLot.name}
                      </h2>
                      <p className="mb-2">{parkingLot.address}</p>
                      <p>{parkingLot.description}</p>
                    </div>
                    <div className="mt-auto">
                      <p className="text-lg mb-0 pb-0">Capacity</p>
                      <p className="">
                        {parkingLot.current_occupancy}/{parkingLot.capacity}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div>no org... create one ?</div>
        )}
      </div>
    </div>
  );
}
