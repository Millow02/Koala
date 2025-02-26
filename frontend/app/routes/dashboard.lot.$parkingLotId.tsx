import { useParams, Link, useOutletContext } from "@remix-run/react";
import { useEffect, useState } from "react";
import { SupabaseClient, User } from "@supabase/auth-helpers-remix";
import { Database } from "~/types/supabase";
import { MapPinIcon } from "@heroicons/react/24/outline";

type ParkingLot = {
  name: string;
};

type ContextType = {
  user: User;
  supabase: SupabaseClient;
};

export default function ParkingLotDetails() {
  const { parkingLotId } = useParams();
  const [parkingLot, setParkingLot] = useState<ParkingLot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { supabase } = useOutletContext<ContextType>();

  useEffect(() => {
    const fetchParkingLot = async () => {
      if (!parkingLotId) {
        setError("Parking lot ID is required");
        return;
      }

      const { data, error } = await supabase
        .from("ParkingLot")
        .select("name")
        .eq("id", parkingLotId)
        .single();

      if (error) {
        setError("Parking lot not found");
        console.error("Error fetching parking lot:", error);
      } else {
        setParkingLot(data);
        console.log(data);
      }
    };

    fetchParkingLot();
  }, [parkingLotId, supabase]);

  if (error) {
    return <div>{error}</div>;
  }

  if (!parkingLot) {
    return <div>Loading...</div>;
  }

  return (
    <div className="relative">
      <div className="w-full px-12 py-4">
        <h1 className="text-3xl font-bold">{parkingLot.name}</h1>
        <hr className="border-pink-500 border-1 my-6" />
      </div>
    </div>
  );
}