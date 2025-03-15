import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
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
  const [userVehicles, setUserVehicles] = useState<Vehicle[]>([]);
  const [animatedCards, setAnimatedCards] = useState<AnimatedCardsState>({});

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

      query.in("id", subscribedLotIds);

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
      <h1 className="text-3xl font-bold">Memberships</h1>
      <hr className="border-pink-500 border-1 mt-6 mb-12" />

      <div className="flex justify-between">
        <div className="flex justify-end items-center mb-4 w-full">
          <div className="relative w-96">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <MagnifyingGlassIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </div>
            <input
              type="text"
              placeholder="Search Memberships"
              className="block w-full bg-slate-700 border-none rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-8">
        {parkingLots.map((parkingLot) => (
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
                  <h2 className="text-4xl font-semibold">{parkingLot.name}</h2>
                  <div className="flex">
                    <MapPinIcon className="h-6 w-6 inline-block mr-1" />
                    <p>{parkingLot.address}</p>
                  </div>
                </div>
                <div className="w-full max-w-64 flex flex-col gap-2 mr-8">
                  <Link
                    to="/dashboard/client-memberships"
                    className="w-full max-w-64 min-h-12 text-lg text-center bg-pink-500 rounded-lg mr-8 px-4 py-2 hover:bg-pink-600 transition-colors"
                  >
                    Manage membership
                  </Link>
                </div>
              </div>
              <p className="text-lg font-semibold">{parkingLot.description}</p>
              <p className="text-lg font-semibold">
                Current occupancy:
                <span className="font-normal">
                  {" "}
                  {parkingLot.current_occupancy}/{parkingLot.capacity}{" "}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
