import { Link, useOutletContext } from "@remix-run/react";
import { LoaderFunction } from "@remix-run/server-runtime";
import { SupabaseClient, User } from "@supabase/auth-helpers-remix";
import { CodeSquare, MapPinIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  createNotification,
  createParkingRequestNotification,
} from "~/models/notification";

import { Database } from "~/types/supabase";

type ContextType = {
  user: User;
  supabase: SupabaseClient;
};

type Profile = Database["public"]["Tables"]["Profile"]["Row"];
type ParkingLot = Database["public"]["Tables"]["ParkingLot"]["Row"];
type Vehicle = Database["public"]["Tables"]["Vehicle"]["Row"];
type ParkingLotWithOwner = Database["public"]["Tables"]["ParkingLot"]["Row"] & {
  Organization: Database["public"]["Tables"]["Organization"]["Row"];
};
type AnimatedCardsState = Record<number, boolean>;

export const loader: LoaderFunction = async ({ params, request }) => {
  return null;
};

export default function Facilities() {
  const { supabase, user } = useOutletContext<{
    supabase: SupabaseClient;
    user: User;
  }>();

  const [parkingLots, setParkingLots] = useState<ParkingLotWithOwner[]>([]);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [userVehicles, setUserVehicles] = useState<Vehicle[]>([]);
  const [parkingLotId, setParkingLotId] = useState<number | null>(null);
  const [parkingLotName, setParkingLotName] = useState<string>("");
  const [parkingLotOwner, setParkingLotOwner] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [animatedCards, setAnimatedCards] = useState<AnimatedCardsState>({});
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    null
  );

  const loadFacilities = async () => {
    if (!user) return;

    try {
      const { data: userMembershipsData } = await supabase
        .from("Membership")
        .select("parkingLotId")
        .eq("clientId", user.id);

      const subscribedLotIds =
        userMembershipsData?.map((m) => m.parkingLotId) ?? [];

      const query = supabase.from("ParkingLot").select(`
          *,
          Organization (
            id,
            name,
            owner,
            created_at
          )
        `);

      if (subscribedLotIds.length > 0) {
        query.not("id", "in", `(${subscribedLotIds.join(",")})`);
      }

      const { data: lotData, error: lotError } = await query;

      if (lotError) {
        console.error("Error fetching parking lots:", lotError);
        return;
      }

      setParkingLots((lotData || []) as unknown as ParkingLotWithOwner[]);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    loadFacilities();
  }, [supabase, user]);

  useEffect(() => {
    const loadVehicles = async () => {
      if (!user) return;

      try {
        const { data: vehicleData, error: vehicleError } = await supabase
          .from("Vehicle")
          .select("*")
          .eq("profile_id", user.id);

        setUserVehicles(vehicleData ?? []);

        if (vehicleError) throw vehicleError;
      } catch (err) {
        console.log("Error loading vehicles", err);
      }
    };
    if (isModalOpen) {
      loadVehicles();
    }
  }, [isModalOpen, supabase, user]);

  useEffect(() => {
    if (parkingLots.length > 0) {
      animateParkingLotCards(parkingLots, setAnimatedCards);
    }
  }, [parkingLots.length]);

  const handleSuccessfulSubscription = async (): Promise<void> => {
    closeSubscribeModalForm();
    setIsLoading(true);
    loadFacilities();

    // if (user) {
    //   try {
    //     const { data: userMembershipsData } = await supabase
    //       .from("Membership")
    //       .select("parkingLotId")
    //       .eq("clientId", user.id);

    //     const subscribedLotIds =
    //       userMembershipsData?.map((m) => m.parkingLotId) ?? [];

    //     const { data: lotData, error: lotError } = await supabase.from(
    //       "ParkingLot"
    //     ).select(`
    //       *,
    //       Organization (
    //         id,
    //         name,
    //         owner,
    //         created_at
    //       )
    //     `);

    //     setTimeout(() => {
    //       setParkingLots(lotData ?? []);

    //       if (lotData) {
    //         animateParkingLotCards(lotData, setAnimatedCards);
    //       }

    //       setIsLoading(false);
    //     }, 300);
    //   } catch (err) {
    //     console.error(err);
    //     setIsLoading(false);
    //   }
    //  }
  };

  const subscribeToParkingLot = async (
    parkingLotId: number | null,
    vehicleId: number | null,
    owner: number | null
  ) => {
    try {
      setIsSubscribing(true);

      if (!vehicleId) return;

      const { error: subscribeError } = await supabase
        .from("Membership")
        .insert({
          clientId: user.id,
          parkingLotId: parkingLotId,
          vehicle_id: vehicleId,
          status: "Pending",
        });

      if (subscribeError) throw subscribeError;

      await handleSuccessfulSubscription();
      createParkingRequestNotification(
        user.id,
        parkingLotId,
        parkingLotName,
        owner,
        supabase
      );
    } catch (subscribeError) {
      console.error("Error subscribing:", subscribeError);
    }
  };

  const openSubscribeModal = (
    parkingLotId: number,
    parkingLotName: string,
    owner: number
  ) => {
    setParkingLotId(parkingLotId);
    setParkingLotName(parkingLotName);
    setParkingLotOwner(owner);
    setIsModalOpen(true);
    setTimeout(() => setIsAnimating(true), 50);
  };

  const closeSubscribeModalForm = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsModalOpen(false);
      setParkingLotId(null);
      setParkingLotOwner(null);
      setSelectedVehicleId(null);
    }, 300);
  };

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
      <h1 className="text-3xl mb-16 mt-8">Facilities</h1>
      <div className="flex flex-col items-center gap-8">
        {parkingLots.map((parkingLot) => (
          <div
            key={parkingLot.id}
            className={`w-full shadow-md rounded-xl flex py-8 transition-all duration-500 ease-in-out ${
              animatedCards[parkingLot.id] !== undefined &&
              animatedCards[parkingLot.id]
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
            style={{ backgroundColor: "#333842" }}
          >
            <div className="max-w-64  ml-4">
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
                  <h2 className="text-4xl font-semibold">{parkingLot.name}</h2>
                  <div className="flex">
                    <MapPinIcon className="h-6 w-6 inline-block mr-1" />
                    <p>{parkingLot.address}</p>
                  </div>
                </div>
                <div className="w-full max-w-64 flex flex-col gap-2 mr-8">
                  <button
                    className="w-full max-w-64 min-h-12 text-lg font-semibold bg-pink-500 rounded-lg mr-8 px-4 py-2 hover:bg-pink-600 transition-colors"
                    onClick={() =>
                      openSubscribeModal(
                        parkingLot.id,
                        parkingLot.name,
                        parkingLot.Organization?.owner
                      )
                    }
                  >
                    Subscribe a vehicle
                  </button>
                  <button className="w-full max-w-64 max-h-12 text-lg font-semibold bg-transparent border border-white rounded-lg mr-8 px-4 py-2 hover:bg-neutral-100/10 transition-colors">
                    View details
                  </button>
                </div>
              </div>

              <p className="text-lg font-semibold">
                Current Capacity:{" "}
                <span className="text-med font-normal">
                  {parkingLot.current_occupancy}/{parkingLot.capacity}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div
          className={`fixed inset-0 bg-gray-800 bg-opacity-80 flex items-center justify-center z-50 transition-opacity duration-300 ${
            isAnimating ? "opacity-100" : "opacity-0"
          }`}
          onClick={closeSubscribeModalForm}
        >
          <div
            className={`bg-neutral-800 rounded-lg shadow-2xl w-1/4 transition-transform duration-300 ${
              isAnimating ? "scale-100" : "scale-95"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 mt-4">
              <h2 className="text-white text-3xl font-bold">
                Subscribe to parking lot?
              </h2>
              <button
                className="flex items-center justify-center rounded-full p-2 hover:bg-neutral-900 transition-opacity duration-300"
                onClick={closeSubscribeModalForm}
              >
                <img src="/x.svg" alt="Close" className="w-8 h-8 text-white" />
              </button>
            </div>
            <hr className="bg-neutral-600 h-px border-0 my-4" />
            <div className="flex flex-col w-full px-6 my-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  subscribeToParkingLot(
                    parkingLotId,
                    selectedVehicleId,
                    parkingLotOwner
                  );
                }}
              >
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl">Select a vehicle</h3>
                  <select
                    id="vehicle-select"
                    value={selectedVehicleId ?? ""}
                    onChange={(e) =>
                      setSelectedVehicleId(Number(e.target.value))
                    }
                    className="text-white bg-black p-2 rounded-lg"
                  >
                    <option value="" disabled>
                      -- Select a vehicle --
                    </option>
                    {userVehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.name} - {vehicle.model}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full text-base bg-pink-500 rounded-lg p-2 hover:bg-pink-700 active:text-white transition-colors mt-8 font-bold"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
