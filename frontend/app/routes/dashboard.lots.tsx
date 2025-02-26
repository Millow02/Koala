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
import { MapPinIcon } from "@heroicons/react/24/outline";

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
  const [organizationName, setOrganizationName] = useState<string | null>(null);

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

        if (organizationId) {
          const { data: organizationData, error: organizationError } = await supabase
            .from("Organization")
            .select("name")
            .eq("id", organizationId)
            .single();

          if (organizationError) {
            console.error("Error fetching organization:", organizationError);
            return;
          }

          setOrganizationName(organizationData?.name || "Unknown Organization");

          const { data: parkingLotData, error: parkingLotError } = await supabase
            .from("ParkingLot")
            .select("*")
            .eq("organizationId", organizationId);

          if (parkingLotError) {
            console.error("Error fetching lots:", parkingLotError);
          } else {
            setParkingLots(parkingLotData || []);
          }
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
      <h1 className="text-3xl font-bold ">Parking Lots</h1>
      <hr className="border-pink-500 border-1 my-6" />
        <div className="flex justify-between items-center mb-8">
          <div className="flex flex-col">
            
            <h1 className="text-3xl font-semibold ">Organization: {organizationName}</h1>
          </div>
          <div className="flex space-x-8">
            {organizationId ? (
              <div className="flex gap-x-4">
                <Link
                  to={`/dashboard/new-lot/${organizationId}`}
                  key={`new-lot-${organizationId}`}
                  className="text-base bg-pink-500 rounded-lg p-2 hover:scale-105 transition-transform duration-300 active:bg-pink-600"
                >
                  New Parking Lot
                </Link>
                <Link
                  to={`/dashboard/organization/${organizationId}`}
                  key={`view-org-${organizationId}`}
                  className="text-base bg-transparent border-neutral-600 border rounded-lg p-2 active:bg-pink-600"
                >
                  View Organization
                </Link>
              </div>
            ) : (
              <div className="flex gap-x-4">
                <Link
                  to={`/dashboard/new-organization/`}
                  key={organizationId}
                  className="text-base bg-transparent border-neutral-600 border rounded-lg p-2 active:bg-pink-600"
                >
                  Create Organization
                </Link>
                <Link
                  to={`/dashboard/join-organization`}
                  className="text-base bg-pink-500 rounded-lg p-2 hover:scale-105 transition-transform duration-300 active:bg-pink-600"
                >
                  Join Organization
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* for next time: should display all the parking lots of your organization */}
        {organizationId ? (
          <div className="flex flex-wrap gap-x-2 justify-center">
            {parkingLots.map((parkingLot) => (
              <Link
                key={`parking-lot-${parkingLot.id}`}
                to={`/dashboard/lot/${parkingLot.id}`}
                className="w-4/6 min-w-64 mt-8 mr-6 rounded-xl border border-neutral-500 hover:border hover:border-white hover:scale-105 transition duration-200 cursor-pointer"
                onClick={() => console.log(`Navigating to parking lot ${parkingLot.id}`)}
              >
                <div className="h-64 shadow-md rounded-xl  hover:border-white" style={{ backgroundColor: "#333842" }}>
                  <div className="flex flex-col flex-wrap h-full">
                    <div className="flex bg-sky-900 px-2 py-4 rounded-t-xl border-b-2 border-neutral-500">
                      <h2 className="text-3xl font-semibold ">
                        {parkingLot.name}
                      </h2>
                    </div>

                    <div className="flex">
                      <div className="min-w-48 min-h-36 w-48 h-36 border-2 m-4 rounded-md border-neutral-500 bg-slate-400">
                        {parkingLot.picture ? (
                            <img
                              src={parkingLot.picture}
                              alt={parkingLot.name}
                              className="w-full h-full object-cover rounded-md"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-300 rounded-md flex items-center justify-center">
                              No Image
                            </div>
                          )}
                      </div>

                      <div className="p-4">
                        <div className="flex">
                          <MapPinIcon className="h-6 w-6 inline-block" />
                          <p className="mb-2">{parkingLot.address}</p>
                        </div>
                          <p className="mb-5">{parkingLot.description}</p>
                        <div className="flex items-center">
                          <p className="text-med font-semibold mr-6 w-36">Cameras Total: </p>
                          <p className="">
                            insert total
                          </p>
                        </div>
                        <div className="flex items-center">
                          <p className="text-med font-semibold mr-6 w-36">Membership Total: </p>
                          <p className="">
                            insert total
                          </p>
                        </div>
                        <div className="flex items-center">
                          <p className="text-med font-semibold mr-6 w-36">Capacity: </p>
                          <p className="">
                            {parkingLot.current_occupancy}/{parkingLot.capacity}
                          </p>
                        </div>
                      </div>

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
