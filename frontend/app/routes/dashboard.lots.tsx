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
import { LoaderPinwheel } from "lucide-react";

type ContextType = {
  user: User;
  supabase: SupabaseClient;
};

type ParkingLot = Database["public"]["Tables"]["ParkingLot"]["Row"];
type Organization = Database["public"]["Tables"]["Organization"]["Row"];
type AnimatedCardsState = Record<number, boolean>;

export default function Lots() {
  const { user, supabase } = useOutletContext<ContextType>();

  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [organizationId, setOrganizationId] = useState<number | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [animatedCards, setAnimatedCards] = useState<AnimatedCardsState>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadLots = async () => {
      if (!user) {
        return;
      }

      try {
        setIsLoading(true);
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
          const { data: organizationData, error: organizationError } =
            await supabase
              .from("Organization")
              .select("name")
              .eq("id", organizationId)
              .single();

          if (organizationError) {
            console.error("Error fetching organization:", organizationError);
            return;
          }

          setOrganizationName(organizationData?.name || "Unknown Organization");

          const { data: parkingLotData, error: parkingLotError } =
            await supabase
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
      } finally {
        setIsLoading(false);
      }
    };

    loadLots();
  }, [supabase, user]);

  useEffect(() => {
    if (parkingLots.length > 0) {
      animateParkingLotCards(parkingLots, setAnimatedCards);
    }
  }, [parkingLots.length]);

  const animateParkingLotCards = (
    lots: ParkingLot[],
    setAnimatedCards: React.Dispatch<React.SetStateAction<AnimatedCardsState>>
  ) => {
    const initialAnimatedState: AnimatedCardsState = {};
    lots.forEach((lot) => {
      initialAnimatedState[lot.id] = false;
    });

    setAnimatedCards(initialAnimatedState);

    lots.forEach((lot, index) => {
      setTimeout(() => {
        setAnimatedCards((prev) => ({
          ...prev,
          [lot.id]: true,
        }));
      }, index * 250);
    });
  };

  return (
    <div className="px-32">
      <div className="flex justify-between">
        <h1 className="text-3xl">Parking Lots</h1>
        <h1 className="text-3xl">Organization: {organizationName}</h1>
      </div>
      <hr className="border-pink-500 border-1 mt-6 mb-12" />

      <div className="flex justify-start">
        {isLoading ? (
          <div></div>
        ) : (
          <div className="flex justify-start">
            {organizationId ? (
              <div className="flex gap-x-4 mb-4">
                <Link
                  to={`/dashboard/new-lot/${organizationId}`}
                  key={`new-lot-${organizationId}`}
                  className="flex justify-center items-center text-center px-8 bg-pink-500 rounded-lg transition-colors hover:bg-pink-600"
                >
                  New Parking Lot
                </Link>
                <Link
                  to={`/dashboard/organization/${organizationId}`}
                  key={`view-org-${organizationId}`}
                  className="flex justify-center items-center text-center text-lg bg-transparent border border-white rounded-lg mr-8 px-4 py-2 hover:bg-neutral-100/10 transition-colors"
                >
                  View Organization
                </Link>
              </div>
            ) : (
              <div className="flex gap-x-4 mb-4">
                <Link
                  to={`/dashboard/new-organization/`}
                  key="new-org"
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
        )}
      </div>

      <div className="flex flex-col items-center gap-8">
        {organizationId ? (
          parkingLots.map((parkingLot) => (
            <div
              key={parkingLot.id}
              className={`w-full shadow-md rounded-xl flex py-8 transition-all duration-500 ease-in-out ${
                animatedCards[parkingLot.id]
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
              style={{ backgroundColor: "#333842" }}
            >
              <div className="max-w-64 ml-4">
                {parkingLot.picture ? (
                  <img
                    src={parkingLot.picture}
                    alt={parkingLot.name}
                    className="w-full h-full object-cover rounded-md"
                  />
                ) : (
                  <div className="w-64 h-64 bg-neutral-600 text-2xl font-bold rounded-md flex items-center justify-center text-white">
                    <p>No Image</p>
                  </div>
                )}
              </div>

              <div className="w-full flex flex-col ml-4 justify-between gap-3">
                <div className="flex justify-between">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-4xl font-semibold">
                      {parkingLot.name}
                    </h2>
                    <div className="flex">
                      <MapPinIcon className="h-6 w-6 inline-block mr-1" />
                      <p>{parkingLot.address}</p>
                    </div>
                  </div>
                  <div className="w-full max-w-64 flex flex-col gap-2 mr-8">
                    <Link
                      to={`/dashboard/admin-memberships/${parkingLot.id}`}
                      className="w-full max-w-64 min-h-12 text-lg text-center font-semibold bg-pink-500 rounded-lg mr-8 px-4 py-2 hover:bg-pink-600 transition-colors"
                    >
                      Manage memberships
                    </Link>
                    <Link
                      to={`/dashboard/lot/${parkingLot.id}`}
                      className="w-full max-w-64 max-h-12 text-center text-lg font-semibold bg-transparent border border-white rounded-lg mr-8 px-4 py-2 hover:bg-neutral-100/10 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
                <p className="text-lg font-semibold">
                  {parkingLot.description}
                </p>

                <p className="text-lg font-semibold">
                  Cameras Total:{" "}
                  <span className="text-med font-normal">insert total</span>
                </p>

                <p className="text-lg font-semibold">
                  Membership Total:{" "}
                  <span className="text-med font-normal">insert total</span>
                </p>

                <p className="text-lg font-semibold">
                  Current occupation:{" "}
                  <span className="text-med font-normal">
                    {parkingLot.current_occupancy}/{parkingLot.capacity}
                  </span>
                </p>
              </div>
            </div>
          ))
        ) : (
          <div>No organization found</div>
        )}
      </div>
    </div>
  );
}
