import { Link, useOutletContext } from "@remix-run/react";
import { LoaderFunction } from "@remix-run/server-runtime";
import { SupabaseClient, User } from "@supabase/auth-helpers-remix";
import React, { useEffect, useState } from "react";

import { Database } from "~/types/supabase";

type ContextType = {
  user: User;
  supabase: SupabaseClient;
};

type Profile = Database["public"]["Tables"]["Profile"]["Row"];
type ParkingLot = Database["public"]["Tables"]["ParkingLot"]["Row"];

export const loader: LoaderFunction = async ({ params, request }) => {
  return null;
};

export default function Facilities() {
  const { supabase, user } = useOutletContext<{
    supabase: SupabaseClient;
    user: User;
  }>();

  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    const loadFacilities = async () => {
      if (!user) return;

      try {
        const { data: userMembershipsData } = await supabase
          .from("Membership")
          .select("parkingLotId")
          .eq("clientId", user.id);

        const subscribedLotIds =
          userMembershipsData?.map((m) => m.parkingLotId) ?? [];

        const { data: lotData, error: lotError } = await supabase
          .from("ParkingLot")
          .select("*")
          .not("id", "in", `(${subscribedLotIds.join(",")})`);

        setParkingLots(lotData ?? []);
      } catch (err) {
        console.error(err);
      }
    };
    loadFacilities();
  }, [supabase, user, parkingLots]);

  const subscribeToParkingLot = async (parkingLotId: string | number) => {
    try {
      setIsSubscribing(true);

      const { error: subscribeError } = await supabase
        .from("Membership")
        .insert({
          clientId: user.id,
          parkingLotId: parkingLotId,
        });
    } catch (err) {
      // catch me !
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl mb-16">Facilities</h1>
      <div className="flex flex-col items-center gap-8">
        {parkingLots.map((parkingLot) => (
          <div
            key={parkingLot.id}
            className="w-9/12 px-8 py-4 text-xl rounded-lg bg-neutral-700 border border-neutral-700  transition duration-200"
          >
            <div className="flex justify-between">
              <h2>{parkingLot.name}</h2>
              <button
                className="bg-amber-700 rounded-lg px-4 py-2 hover:bg-amber-500 transition-colors"
                onClick={() => subscribeToParkingLot(parkingLot.id)}
              >
                Subscribe
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
